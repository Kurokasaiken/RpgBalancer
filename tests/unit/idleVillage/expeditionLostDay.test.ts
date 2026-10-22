/**
 * PLAN-067 T-C2 (R-234) — the defeat report dates each fallen resident: the run records the quest tick a member
 * fell at, and the report turns it into the game day. A stage copy without a recorded tick shows no date.
 */
import { describe, expect, it } from 'vitest';
import { lostReportModel } from '@/ui/idleVillage/components/gameFrame/expeditionLost';
import { createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';

const run = (): QuestRunState => {
  const r = createRun(GOBLIN_PRESETS[0].id, 7, 'goblin');
  r.party[1].dead = true;
  r.party[1].deadAtTick = 2 * 60 * 3 + 30;
  return r;
};

describe('lostReportModel — day of death (R-234, T-C2)', () => {
  // INV:R-234-expedition-lost-day — the day comes from the recorded death tick; no tick, no date.
  it('dates the fallen from their recorded death tick', () => {
    const r = run();
    const [tomb] = lostReportModel(r, { ticksPerDay: 60, startDay: 1 }).tombs;
    expect(tomb.day).toBe(7); // tick 390 at 60 ticks/day = 6 whole days after day 1
  });
  it('shows no date when the death tick was never recorded', () => {
    const r = run();
    delete r.party[1].deadAtTick;
    expect(lostReportModel(r, { ticksPerDay: 60, startDay: 1 }).tombs[0].day).toBeNull();
  });
});
