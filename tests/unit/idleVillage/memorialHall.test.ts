/**
 * PLAN-067 T-C5 (R-234, DEATH-1 = B) — the fallen do not vanish without a trace. Every death of a run
 * writes one entry to a memorial log (name, level, place, day). Idempotent: a replayed settlement adds
 * nothing twice. The log is pure data here; the menu entry «Memoriale» reads it.
 */
import { describe, expect, it } from 'vitest';
import { memorialEntriesFromPlan, appendMemorial, type MemorialEntry } from '@/ui/idleVillage/memorial/memorialHall';

const plan = (runId: string, deadIds: string[]) => ({
  runId,
  questId: 'goblin',
  outcome: 'wipe',
  effects: deadIds.map((id, i) => ({ key: `dead:${i}:${id}`, kind: 'resident-dead' as const, residentId: id })),
}) as never;

const ctx = {
  nameOf: (id: string) => ({ 'hero-sir-spaccaculi': 'Sir Spaccaculi', 'hero-giggiolillo': 'Giggiolillo' } as Record<string, string>)[id] ?? id,
  levelOf: (id: string) => ({ 'hero-sir-spaccaculi': 3, 'hero-giggiolillo': 4 } as Record<string, number>)[id] ?? 1,
  placeOf: () => 'Sterminio dei goblin',
  dayOf: () => 41,
};

describe('memorial hall (R-234, T-C5)', () => {
  // INV:R-234-memorial-per-death — every resident-dead effect becomes one entry, and a replay adds none.
  it('writes one entry per death with name, level, place and day', () => {
    const entries = memorialEntriesFromPlan(plan('run-7', ['hero-sir-spaccaculi', 'hero-giggiolillo']), ctx);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ key: 'run-7:dead:0:hero-sir-spaccaculi', name: 'Sir Spaccaculi', level: 3, place: 'Sterminio dei goblin', day: 41 });
  });

  it('is idempotent: replaying the same plan adds nothing', () => {
    const once = appendMemorial([], memorialEntriesFromPlan(plan('run-7', ['hero-sir-spaccaculi']), ctx));
    const twice = appendMemorial(once, memorialEntriesFromPlan(plan('run-7', ['hero-sir-spaccaculi']), ctx));
    expect(twice).toHaveLength(1);
    expect(twice).toEqual(once);
  });

  it('keeps the log in the order the deaths happened (oldest first)', () => {
    const a = appendMemorial([], memorialEntriesFromPlan(plan('run-1', ['hero-giggiolillo']), ctx));
    const b = appendMemorial(a, memorialEntriesFromPlan(plan('run-2', ['hero-sir-spaccaculi']), ctx));
    expect(b.map((e: MemorialEntry) => e.key.split(':')[0])).toEqual(['run-1', 'run-2']);
  });

  it('a run with no deaths writes nothing', () => {
    expect(memorialEntriesFromPlan(plan('run-3', []), ctx)).toEqual([]);
  });
});
