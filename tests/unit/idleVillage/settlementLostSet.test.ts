/**
 * PLAN-067 T-C3 (R-234, SET = B) — the settlement-lost summary tells the truth. Before: «residents lost»
 * counted the INJURED, «days» was the 0-based counter, «gold earned» was the gold held, «quests» was a hard
 * 0. Now the tally counts what the settlements really paid and completed, idempotently per run, and the
 * overlay sits above the quest window.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_TALLY, gameOverStats, tallyPlan } from '@/ui/idleVillage/settlement/settlementTally';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

const plan = (runId: string, outcome: string, gold: number) => ({
  runId,
  outcome,
  effects: [
    { key: 'reward:village-gold', kind: 'village-gold', amount: gold },
    { key: 'dead:0:h', kind: 'resident-dead', residentId: 'h' },
  ],
}) as never;

describe('settlement tally (R-234, T-C3)', () => {
  // INV:R-234-settlement-tally — gold and completed quests come from settled runs, once per run.
  it('adds the village gold and one completed quest for a won run, once', () => {
    const once = tallyPlan(EMPTY_TALLY, plan('run-1', 'reward', 40));
    expect(once.goldEarned).toBe(40);
    expect(once.questsCompleted).toBe(1);
    const twice = tallyPlan(once, plan('run-1', 'reward', 40));
    expect(twice).toEqual(once);
  });

  it('a wiped run adds no completed quest', () => {
    const t = tallyPlan(EMPTY_TALLY, plan('run-2', 'wipe', 0));
    expect(t.questsCompleted).toBe(0);
  });
});

describe('game-over stats are true (R-234, T-C3)', () => {
  // INV:R-234-settlement-stats — residents lost counts the DEAD (not the injured); days is the displayed day.
  it('counts the dead, not the injured, and days from 1', () => {
    const state = {
      currentDay: 4,
      residents: [
        { id: 'a', isInjured: true, isDead: false },
        { id: 'b', isInjured: false, isDead: true },
        { id: 'c', isInjured: false, isDead: true },
      ],
    } as never;
    const s = gameOverStats(state);
    expect(s.residentsLost).toBe(2);
    expect(s.daysSurvived).toBe(5);
  });
});

describe('settlement-lost overlay layer (R-234, T-C3)', () => {
  // INV:R-234-settlement-lost-layer — the overlay paints above the quest check and the reward report.
  it('sits above the quest check and the reward layer', () => {
    const z = DEFAULT_GAME_FRAME_CONFIG.zLayers;
    expect(z.settlementLost).toBeGreaterThan(z.questCheck);
    expect(z.settlementLost).toBeGreaterThan(z.reward);
  });
});
