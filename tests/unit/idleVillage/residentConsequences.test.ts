/**
 * R-186 T-1 — residentConsequences kernel: unit rules, aggregate parity,
 * and the R-139 mid-activity recovery guard in TimeEngine.
 *
 * Parity contract: the SAME consequence sequence applied through the real
 * /game adapter (`applyPlanToState` on MinimalResident) and through the
 * canonical adapter (`applyConsequenceToResidentState` on ResidentState)
 * must produce identical normalized projections; on death both aggregates
 * must clear every wound field (raw equivalence).
 */
import { describe, expect, it } from 'vitest';
import {
  applyConsequencesToVillage,
  applyConsequenceToResidentState,
  normalizeMinimalResident,
  normalizeResidentState,
  reduceResidentHealth,
  resolveWoundTicks,
  settlementEffectKey,
  type ResidentConsequence,
  type ResidentHealthSlice,
} from '@/engine/game/idleVillage/residentConsequences';
import {
  advanceTime,
  canScheduleActivity,
  createInitialVillageState,
  scheduleActivity,
  type ResidentState,
  type TimeEngineDeps,
  type VillageState,
} from '@/engine/game/idleVillage/TimeEngine';
import { applyPlanToState, type SettlementEffect } from '@/ui/idleVillage/quests/questSettlement';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { MinimalGameplayState } from '@/store/useMinimalGameplay';
import type { MinimalResident } from '@/ui/idleVillage/types/gameplayTypes';

const DEFAULTS = { woundTicks: 5 };

/* ------------------------------------------------------------------ */
/* Micro-rules                                                        */
/* ------------------------------------------------------------------ */

describe('settlementEffectKey', () => {
  it('formats `${runId}:${effectKey}`', () => {
    expect(settlementEffectKey('run-1', 'dead:0:r1')).toBe('run-1:dead:0:r1');
  });
});

describe('resolveWoundTicks', () => {
  it('accepts finite integers >= 1, falls back otherwise', () => {
    expect(resolveWoundTicks(7, 5)).toBe(7);
    expect(resolveWoundTicks(1, 5)).toBe(1);
    expect(resolveWoundTicks(0, 5)).toBe(5);
    expect(resolveWoundTicks(-3, 5)).toBe(5);
    expect(resolveWoundTicks(2.5, 5)).toBe(5);
    expect(resolveWoundTicks(Number.NaN, 5)).toBe(5);
    expect(resolveWoundTicks(Number.POSITIVE_INFINITY, 5)).toBe(5);
    expect(resolveWoundTicks(undefined, 5)).toBe(5);
    expect(resolveWoundTicks(undefined, 0)).toBe(1); // degenerate fallback clamps to 1
  });
});

describe('reduceResidentHealth', () => {
  const healthy: ResidentHealthSlice = { dead: false, injured: false, injuredUntil: null, xp: 0 };

  it('wound: sets injured, injuredUntil = now + duration', () => {
    const h = reduceResidentHealth(healthy, { kind: 'wound', durationTicks: 3 }, 10, DEFAULTS);
    expect(h).toEqual({ dead: false, injured: true, injuredUntil: 13, xp: 0 });
  });

  it('wound: falls back to defaults.woundTicks', () => {
    const h = reduceResidentHealth(healthy, { kind: 'wound' }, 10, DEFAULTS);
    expect(h.injuredUntil).toBe(15);
  });

  it('wound on wounded: keeps the LONGER recovery (max semantics)', () => {
    const long: ResidentHealthSlice = { dead: false, injured: true, injuredUntil: 20, xp: 0 };
    expect(
      reduceResidentHealth(long, { kind: 'wound', durationTicks: 2 }, 10, DEFAULTS).injuredUntil,
    ).toBe(20);
    expect(
      reduceResidentHealth(long, { kind: 'wound', durationTicks: 12 }, 10, DEFAULTS).injuredUntil,
    ).toBe(22);
  });

  it('wound on dead is a no-op', () => {
    const dead: ResidentHealthSlice = { dead: true, injured: false, injuredUntil: null, xp: 4 };
    expect(reduceResidentHealth(dead, { kind: 'wound' }, 10, DEFAULTS)).toEqual(dead);
  });

  it('death: terminal — clears wound fields, keeps xp', () => {
    const hurt: ResidentHealthSlice = { dead: false, injured: true, injuredUntil: 20, xp: 7 };
    expect(reduceResidentHealth(hurt, { kind: 'death' }, 10, DEFAULTS)).toEqual({
      dead: true,
      injured: false,
      injuredUntil: null,
      xp: 7,
    });
  });

  it('xp is a guarded delta — adds, never sets', () => {
    const h = reduceResidentHealth({ ...healthy, xp: 5 }, { kind: 'xp', amount: 3 }, 10, DEFAULTS);
    expect(h.xp).toBe(8);
  });
});

/* ------------------------------------------------------------------ */
/* Aggregate parity — MinimalResident (via real applyPlanToState)     */
/*                    vs ResidentState (via kernel adapter)           */
/* ------------------------------------------------------------------ */

type MinimalState = MinimalGameplayState['state'];

const mkMinimal = (over: Partial<MinimalResident> = {}): MinimalResident => ({
  id: 'r-1',
  name: 'R',
  stats: {},
  fatigue: 0,
  isWorking: false,
  isInjured: false,
  isHero: false,
  level: 1,
  ...over,
});

const mkEngine = (over: Partial<ResidentState> = {}): ResidentState => ({
  id: 'r-1',
  status: 'available',
  fatigue: 0,
  currentHp: 100,
  maxHp: 100,
  isHero: false,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
  ...over,
});

const mkMinState = (resident: MinimalResident): MinimalState =>
  ({ gold: 0, xp: 0, appliedQuestEffectIds: [], residents: [resident], eventLog: [] }) as MinimalState;

/** Apply one consequence through the REAL /game settlement adapter:
 *  a single-effect plan applied via `applyPlanToState`. */
const applyToMinimal = (
  state: MinimalState,
  step: { consequence: ResidentConsequence; key: string },
  now: number,
): MinimalState => {
  const residentId = state.residents[0].id;
  const effect: SettlementEffect =
    step.consequence.kind === 'wound'
      ? { key: step.key, kind: 'resident-wounded', residentId, durationTicks: step.consequence.durationTicks }
      : step.consequence.kind === 'death'
        ? { key: step.key, kind: 'resident-dead', residentId }
        : { key: step.key, kind: 'resident-xp', residentId, amount: step.consequence.amount };
  const plan = {
    runId: 'run-parity',
    questId: 'q',
    outcome: 'test',
    leaderAlive: true,
    objectiveDone: true,
    effects: [effect],
  };
  return applyPlanToState(state, plan, now).next;
};

describe('parity: MinimalResident ↔ ResidentState', () => {
  const starts: { name: string; min: MinimalResident; eng: ResidentState }[] = [
    { name: 'healthy', min: mkMinimal(), eng: mkEngine() },
    {
      name: 'injured-short',
      min: mkMinimal({ isInjured: true, injuredUntilTick: 12 }),
      eng: mkEngine({ status: 'injured', isInjured: true, injuryRecoveryTime: 12 }),
    },
    {
      name: 'injured-long',
      min: mkMinimal({ isInjured: true, injuredUntilTick: 40 }),
      eng: mkEngine({ status: 'injured', isInjured: true, injuryRecoveryTime: 40 }),
    },
    {
      name: 'dead',
      min: mkMinimal({ isDead: true }),
      eng: mkEngine({ status: 'dead', currentHp: 0 }),
    },
  ];

  const sequence: { consequence: ResidentConsequence; key: string }[] = [
    { consequence: { kind: 'wound', durationTicks: 5 }, key: 'w1' },
    { consequence: { kind: 'wound', durationTicks: 2 }, key: 'w2' }, // shorter — must not shorten
    { consequence: { kind: 'wound', durationTicks: 9 }, key: 'w3' }, // longer — extends
    { consequence: { kind: 'xp', amount: 4 }, key: 'xp1' },
    { consequence: { kind: 'death' }, key: 'd1' },
    { consequence: { kind: 'wound', durationTicks: 3 }, key: 'w4' }, // after death — no-op
    { consequence: { kind: 'xp', amount: 1 }, key: 'xp2' },          // after death — delta still lands
  ];

  for (const s of starts) {
    it(`start=${s.name}: normalized projections stay equal step by step`, () => {
      let minState = mkMinState(s.min);
      let eng = s.eng;
      let now = 10;
      for (const step of sequence) {
        minState = applyToMinimal(minState, step, now);
        eng = applyConsequenceToResidentState(eng, step.consequence, now, DEFAULTS);
        const min = minState.residents[0];
        expect(normalizeMinimalResident(min)).toEqual(normalizeResidentState(eng));
        if (normalizeResidentState(eng).dead) {
          /* Raw invariants on death — not just the projection. */
          expect(eng.isInjured).toBe(false);
          expect(eng.injuryRecoveryTime).toBeUndefined();
          expect(eng.currentHp).toBe(0);
          expect(min.injuredUntilTick).toBeUndefined();
          expect(min.isInjured).toBe(false);
        }
        now += 1;
      }
    });
  }

  it('recovery time never decreases while injured', () => {
    let eng = mkEngine({ status: 'injured', isInjured: true, injuryRecoveryTime: 30 });
    for (const d of [1, 2, 5, 1]) {
      const before = eng.injuryRecoveryTime ?? 0;
      eng = applyConsequenceToResidentState(eng, { kind: 'wound', durationTicks: d }, 10, DEFAULTS);
      expect(eng.injuryRecoveryTime ?? 0).toBeGreaterThanOrEqual(before);
    }
    expect(eng.injuryRecoveryTime).toBe(30);
  });
});

/* ------------------------------------------------------------------ */
/* VillageState adapter                                               */
/* ------------------------------------------------------------------ */

describe('applyConsequencesToVillage', () => {
  it('applies in array order, skips unknown ids, preserves other residents', () => {
    const state: VillageState = createInitialVillageState();
    state.residents = {
      a: mkEngine({ id: 'a' }),
      b: mkEngine({ id: 'b' }),
    };
    const next = applyConsequencesToVillage(
      state,
      [
        { residentId: 'a', consequence: { kind: 'wound', durationTicks: 3 } },
        { residentId: 'ghost', consequence: { kind: 'death' } },
        { residentId: 'b', consequence: { kind: 'xp', amount: 2 } },
      ],
      10,
      DEFAULTS,
    );
    expect(next.residents.a.status).toBe('injured');
    expect(next.residents.a.injuryRecoveryTime).toBe(13);
    expect(next.residents.b.status).toBe('available');
    expect(next.residents.b.xp).toBe(2);
    expect(next.residents.ghost).toBeUndefined();
    /* Empty entry list is a free no-op (same reference). */
    expect(applyConsequencesToVillage(state, [], 10, DEFAULTS)).toBe(state);
  });
});

/* ------------------------------------------------------------------ */
/* R-139 guard — wound mid-activity on a multi-day job                */
/* ------------------------------------------------------------------ */

const cloneConfig = (): IdleVillageConfig => JSON.parse(JSON.stringify(DEFAULT_IDLE_VILLAGE_CONFIG));

describe('mid-activity wound (R-139: heal only at rest)', () => {
  const setup5Day = () => {
    const config = cloneConfig();
    config.activities.long_haul = {
      id: 'long_haul',
      durationFormula: '5',
      slotTags: [],
      tags: [],
      inputs: [],
      outputs: [],
    } as never;
    const deps: TimeEngineDeps = { config, rng: () => 0.5 };
    const state = createInitialVillageState();
    state.residents = { 'r-1': mkEngine({ id: 'r-1' }) };
    const sch = scheduleActivity(deps, state, {
      activityId: 'long_haul',
      characterIds: ['r-1'],
      slotId: 's',
    });
    expect(sch.error).toBeUndefined();
    return { deps, state: sch.state };
  };

  const trySchedule = (state: VillageState) =>
    canScheduleActivity(state, {
      activityId: 'long_haul',
      characterIds: ['r-1'],
      slotId: 's',
    });

  it('wounded at tick 1 (1d wound): stays injured while activity runs, heals when home', () => {
    const { deps, state } = setup5Day();
    /* Activity runs 0→5; a 1-day wound lands at tick 1 (recovery due at 2). */
    const wounded = applyConsequencesToVillage(
      { ...state, currentTime: 1 },
      [{ residentId: 'r-1', consequence: { kind: 'wound', durationTicks: 1 } }],
      1,
      DEFAULTS,
    );
    expect(wounded.residents['r-1'].status).toBe('injured');
    expect(wounded.residents['r-1'].injuryRecoveryTime).toBe(2);

    /* Ticks 2..4: recovery time has passed but the activity still owns the
     * member (endTime 5 > tickEnd) — must NOT flip to available. */
    const mid = advanceTime(deps, wounded, 3).state; // → tick 4
    expect(mid.currentTime).toBe(4);
    expect(mid.residents['r-1'].status).toBe('injured');
    expect(trySchedule(mid)).toBe(false);

    /* Tick 5: the activity completes (endTime <= tickEnd). The completion
     * path only transitions 'away' members — it must not overwrite the
     * wound; the resident is finally at rest and the overdue wound heals. */
    const done = advanceTime(deps, mid, 1).state;
    expect(done.currentTime).toBe(5);
    const home = done.residents['r-1'];
    expect(home.isInjured).toBe(false);
    expect(home.injuryRecoveryTime).toBeUndefined();
    expect(home.status === 'available' || home.status === 'exhausted').toBe(true);
    /* Free again once home and healed. */
    if (home.status === 'available') {
      expect(trySchedule(done)).toBe(true);
    }
  });

  it('wound with recovery DURING activity then expiring AFTER completion: heals at rest only', () => {
    const { deps, state } = setup5Day();
    /* 5-day wound at tick 1 → recovery due at 6, one tick AFTER the
     * activity ends at 5. The member stays injured through completion and
     * heals at the first resting sweep. */
    const wounded = applyConsequencesToVillage(
      { ...state, currentTime: 1 },
      [{ residentId: 'r-1', consequence: { kind: 'wound', durationTicks: 5 } }],
      1,
      DEFAULTS,
    );
    const done = advanceTime(deps, wounded, 4).state; // → tick 5, activity completes
    expect(done.residents['r-1'].status).toBe('injured');
    const healed = advanceTime(deps, done, 1).state; // → tick 6
    expect(healed.residents['r-1'].status === 'available' || healed.residents['r-1'].status === 'exhausted').toBe(true);
    expect(healed.residents['r-1'].isInjured).toBe(false);
  });

  it('dead mid-activity: stays dead through completion, never schedulable', () => {
    const { deps, state } = setup5Day();
    const dead = applyConsequencesToVillage(
      { ...state, currentTime: 1 },
      [{ residentId: 'r-1', consequence: { kind: 'death' } }],
      1,
      DEFAULTS,
    );
    const after = advanceTime(deps, dead, 5).state; // completes + beyond
    expect(after.residents['r-1'].status).toBe('dead');
    expect(after.residents['r-1'].isInjured).toBe(false);
    expect(trySchedule(after)).toBe(false);
  });
});
