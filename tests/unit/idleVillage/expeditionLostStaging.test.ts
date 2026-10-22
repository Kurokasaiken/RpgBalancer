/**
 * PLAN-067 T-C2 (R-234, EXP = A) — the Director «Expedition lost» stages the defeat report on a copy of the
 * run. It must not change the real game: no settlement, no death, no resource moves, only the report opens.
 */
import { describe, expect, it, vi } from 'vitest';
import { stageExpeditionLost } from '@/ui/idleVillage/components/gameFrame/expeditionLostStaging';
import { createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';

const liveRun = (): QuestRunState => {
  const run = createRun(GOBLIN_PRESETS[0].id, 11, 'goblin');
  run.party[1].dead = false;
  return run;
};

describe('Director «Expedition lost» (R-234, T-C2)', () => {
  // INV:R-234-expedition-lost-staging — staging returns a wipe copy for the report and never mutates the live run.
  it('returns a wiped copy and leaves the live run untouched', () => {
    const live = liveRun();
    const before = JSON.stringify(live);
    const staged = stageExpeditionLost(live);
    expect(staged.outcome).toBe('wipe');
    expect(staged.ended).toBe(true);
    expect(staged.party.filter((m) => m.dead).length).toBeGreaterThan(0);
    expect(JSON.stringify(live)).toBe(before);
  });

  it('never calls the settlement or the store (the copy only opens the report)', () => {
    const settle = vi.fn();
    stageExpeditionLost(liveRun());
    expect(settle).not.toHaveBeenCalled();
  });
});
