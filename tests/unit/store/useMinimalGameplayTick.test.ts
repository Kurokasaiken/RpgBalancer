/**
 * Store-level tests for useMinimalGameplay.tick() activity progression.
 *
 * Verifies that the gameplay store advances active activities through the
 * config-driven engine (`processActivitiesTick`) and produces REAL rewards +
 * event-log entries — replacing the previous UI-side reward simulation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';
import { createMinimalRngState } from '@/engine/game/idleVillage/RandomHelper';

const WOOD_JOB_ID = 'job_wood_gathering_stable'; // baseReward wood:2 xp:1, durationTicks:4

function seedStore(ticksRemaining: number) {
  const base = useMinimalGameplayStore.getState();
  useMinimalGameplayStore.setState({
    ...base,
    config: DEFAULT_MINIMAL_CONFIG,
    state: {
      ...base.state,
      gold: 0,
      food: 50,
      maxFood: 50,
      wood: 0,
      xp: 0,
      currentDay: 0,
      currentTick: 0,
      isPaused: false,
      speedMultiplier: 1,
      residents: [
        { id: 'r1', name: 'Aurora', stats: { strength: 5 }, fatigue: 0, isWorking: true, isInjured: false, level: 1 },
      ],
      activeActivities: [{ activityId: WOOD_JOB_ID, residentId: 'r1', ticksRemaining }],
      eventLog: [],
      rngState: createMinimalRngState(42),
    },
  });
}

describe('useMinimalGameplay.tick() — activity progression', () => {
  beforeEach(() => {
    seedStore(4);
  });

  it('decrements ticksRemaining on a single tick without rewarding', () => {
    useMinimalGameplayStore.getState().tick(1000, 'manual');
    const { state } = useMinimalGameplayStore.getState();
    expect(state.activeActivities[0].ticksRemaining).toBe(3);
    expect(state.wood).toBe(0);
  });

  it('completes the activity and applies config-driven rewards after enough ticks', () => {
    // Advance 4 ticks (speed 1x, 1s base) → completes a 4-tick job.
    useMinimalGameplayStore.getState().tick(4000, 'manual');
    const { state } = useMinimalGameplayStore.getState();
    expect(state.activeActivities).toHaveLength(0);
    expect(state.wood).toBe(2); // baseReward.wood from config
    expect(state.xp).toBe(1); // baseReward.xp from config
  });

  it('appends a real completion entry to the event log', () => {
    useMinimalGameplayStore.getState().tick(4000, 'manual');
    const { state } = useMinimalGameplayStore.getState();
    const completion = state.eventLog.find((e) => e.activityId === WOOD_JOB_ID);
    expect(completion).toBeDefined();
    expect(completion?.severity).toBe('success');
    expect(completion?.message).toContain('wood');
  });

  it('does not progress activities while paused', () => {
    useMinimalGameplayStore.setState((s) => ({ state: { ...s.state, isPaused: true } }));
    useMinimalGameplayStore.getState().tick(4000, 'manual');
    const { state } = useMinimalGameplayStore.getState();
    expect(state.activeActivities[0].ticksRemaining).toBe(4);
    expect(state.wood).toBe(0);
  });
});

/** R-139: settlement wounds heal ONLY at rest — `isWorking` or
 *  `isOnExpedition` keeps the wound standing even after `injuredUntilTick`
 *  has passed; the next tick at rest heals it. */
describe('useMinimalGameplay.tick() — wound recovery only at rest', () => {
  const seedWounded = (extra: Record<string, unknown>) => {
    const base = useMinimalGameplayStore.getState();
    useMinimalGameplayStore.setState({
      ...base,
      config: DEFAULT_MINIMAL_CONFIG,
      state: {
        ...base.state,
        gold: 0,
        food: 50,
        currentDay: 0,
        currentTick: 0,
        isPaused: false,
        speedMultiplier: 1,
        residents: [
          {
            id: 'r1',
            name: 'Aurora',
            stats: { strength: 5 },
            fatigue: 0,
            isWorking: false,
            isInjured: true,
            injuredUntilTick: 2,
            level: 1,
            ...extra,
          },
        ],
        activeActivities: [],
        eventLog: [],
        rngState: createMinimalRngState(42),
      },
    });
  };

  it('heals a resting resident once injuredUntilTick has passed', () => {
    seedWounded({});
    useMinimalGameplayStore.getState().tick(4000, 'manual');
    const r = useMinimalGameplayStore.getState().state.residents[0];
    expect(r.isInjured).toBe(false);
    expect(r.injuredUntilTick).toBeUndefined();
  });

  it('does NOT heal while the resident is on expedition', () => {
    seedWounded({ isOnExpedition: true });
    useMinimalGameplayStore.getState().tick(4000, 'manual');
    const r = useMinimalGameplayStore.getState().state.residents[0];
    expect(r.isInjured).toBe(true);
    expect(r.injuredUntilTick).toBe(2);
  });

  it('does NOT heal while the resident is working', () => {
    seedWounded({ isWorking: true });
    useMinimalGameplayStore.getState().tick(4000, 'manual');
    const r = useMinimalGameplayStore.getState().state.residents[0];
    expect(r.isInjured).toBe(true);
  });

  it('heals on the first tick after the expedition flag is released', () => {
    seedWounded({ isOnExpedition: true });
    useMinimalGameplayStore.getState().tick(4000, 'manual');
    expect(useMinimalGameplayStore.getState().state.residents[0].isInjured).toBe(true);
    useMinimalGameplayStore.getState().setResidentsOnExpedition(['r1'], false);
    useMinimalGameplayStore.getState().tick(1000, 'manual');
    const r = useMinimalGameplayStore.getState().state.residents[0];
    expect(r.isInjured).toBe(false);
    expect(r.isOnExpedition).toBeUndefined();
  });

  it('never heals a dead resident', () => {
    seedWounded({ isDead: true, isInjured: false });
    useMinimalGameplayStore.getState().tick(4000, 'manual');
    const r = useMinimalGameplayStore.getState().state.residents[0];
    expect(r.isDead).toBe(true);
    expect(r.isInjured).toBe(false);
  });
});
