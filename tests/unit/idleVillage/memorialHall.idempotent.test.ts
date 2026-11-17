/**
 * memorial-hall living-contract coverage (PLAN-054): the tier-1 kernel
 * `src/ui/idleVillage/memorial/memorialHall.ts` is idempotent — replaying the
 * same settlement appends nothing twice. Kept in its own file: the R-234
 * reproduction host (`memorialHall.test.ts`) is red-first locked.
 */
import { describe, expect, it } from 'vitest';
import { memorialEntriesFromPlan, appendMemorial } from '@/ui/idleVillage/memorial/memorialHall';

const plan = (runId: string, deadIds: string[]) => ({
  runId,
  questId: 'goblin',
  outcome: 'wipe',
  effects: deadIds.map((id, i) => ({ key: `dead:${i}:${id}`, kind: 'resident-dead' as const, residentId: id })),
}) as never;

const ctx = {
  nameOf: (id: string) => id,
  levelOf: () => 3,
  placeOf: () => 'Sterminio dei goblin',
  dayOf: () => 41,
};

describe('memorial hall — idempotent append', () => {
  // INV:memorial-hall.INV-1 — appendMemorial is idempotent: replaying the same settlement adds nothing.
  it('replaying the same plan adds nothing', () => {
    const once = appendMemorial([], memorialEntriesFromPlan(plan('run-7', ['hero-sir-spaccaculi']), ctx));
    const twice = appendMemorial(once, memorialEntriesFromPlan(plan('run-7', ['hero-sir-spaccaculi']), ctx));
    expect(twice).toHaveLength(1);
    expect(twice).toEqual(once);
  });
});
