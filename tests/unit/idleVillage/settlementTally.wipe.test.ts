/**
 * settlement-tally living-contract coverage (PLAN-054): the tier-1 kernel
 * `src/ui/idleVillage/settlement/settlementTally.ts` counts completed quests
 * only for runs that actually paid out — a wipe adds none. Kept in its own
 * file: the R-234 reproduction host (`settlementLostSet.test.ts`) is
 * red-first locked.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_TALLY, tallyPlan } from '@/ui/idleVillage/settlement/settlementTally';

const plan = (runId: string, outcome: string, gold: number) => ({
  runId,
  outcome,
  effects: [
    { key: 'reward:village-gold', kind: 'village-gold', amount: gold },
    { key: 'dead:0:h', kind: 'resident-dead', residentId: 'h' },
  ],
}) as never;

describe('settlement tally — wipe', () => {
  // INV:settlement-tally.INV-1 — a wiped run adds no completed quest to the tally.
  it('a wiped run adds no completed quest', () => {
    const t = tallyPlan(EMPTY_TALLY, plan('run-2', 'wipe', 0));
    expect(t.questsCompleted).toBe(0);
  });
});
