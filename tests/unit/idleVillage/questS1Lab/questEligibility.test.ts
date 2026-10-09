/**
 * PLAN-019-S2.4 T-1 — quest eligibility predicate + derived expedition lock.
 * Director 2026-10-09: injured assignable (no warning — reduced HP and stat
 * modifiers ride inside the S2.2 adapter); dead/away/exhausted blocked;
 * `inExpedition` derived from the persisted run's `party[].id`, never a flag.
 */
import { describe, expect, it } from 'vitest';
import { questResidentEligibility, residentInExpedition } from '@/ui/idleVillage/questS1Lab/questEligibility';
import { QUEST_ELIGIBILITY } from '@/balancing/config/idleVillage/quests/questEligibility';
import { createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

const resident = (over: Partial<ResidentState>): ResidentState =>
  ({
    id: 'res-1',
    name: 'Alda',
    status: 'available',
    statTags: ['edge', 'fortitude'],
    statSnapshot: { hp: 200, damage: 30, txc: 50, evasion: 10 },
    ...over,
  }) as ResidentState;

describe('questResidentEligibility', () => {
  it('available + matching tags → eligible', () => {
    const r = questResidentEligibility(resident({}), { anyOf: ['edge'] }, null);
    expect(r.eligible).toBe(true);
  });

  it('injured is assignable — no warning channel exists (Director)', () => {
    const r = questResidentEligibility(resident({ status: 'injured' }), { anyOf: ['edge'] }, null);
    expect(r).toEqual({ eligible: true });
  });

  it.each(['dead', 'away', 'exhausted'] as const)('status %s → blocked with typed reason', (status) => {
    const r = questResidentEligibility(resident({ status }), undefined, null);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe(`status-${status}`);
  });

  it('missing slot requirement → stat-requirement with the missing tags listed', () => {
    const r = questResidentEligibility(resident({ statTags: ['clarity'] }), { anyOf: ['edge', 'fortitude'] }, null);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe('stat-requirement');
    expect(r.missing).toEqual(['edge', 'fortitude']);
  });

  it('dead beats a missing requirement — structural blocks come first', () => {
    const r = questResidentEligibility(resident({ status: 'dead', statTags: [] }), { anyOf: ['edge'] }, null);
    expect(r.reason).toBe('status-dead');
  });
});

describe('residentInExpedition — derived lock (no separate flag)', () => {
  const runWith = (ids: string[]) =>
    createRun({
      party: {
        members: ids.map((id, i) => ({
          id,
          name: id,
          role: i === 0 ? ('leader' as const) : ('member' as const),
          stats: { str: 50, con: 50, agi: 50, perc: 50, int: 50, cha: 50 },
        })),
      },
      seed: 1,
      questId: 'goblin',
    });

  it('member of the persisted run is locked; outsider is not', () => {
    const run = runWith(['res-1', 'res-2']);
    expect(residentInExpedition('res-1', run)).toBe(true);
    expect(residentInExpedition('res-9', run)).toBe(false);
  });

  it('ended-but-unsettled run still locks the party — they are not back yet', () => {
    const run = runWith(['res-1']);
    run.ended = true;
    run.outcome = 'reward';
    expect(residentInExpedition('res-1', run)).toBe(true);
  });

  it('null run releases everyone (settled/cleared)', () => {
    expect(residentInExpedition('res-1', null)).toBe(false);
    expect(residentInExpedition('res-1', undefined)).toBe(false);
  });

  it('eligibility reports in-expedition for a locked resident', () => {
    const run = runWith(['res-1']);
    const r = questResidentEligibility(resident({}), undefined, run);
    expect(r.eligible).toBe(false);
    expect(r.reason).toBe('in-expedition');
  });
});

describe('QUEST_ELIGIBILITY config', () => {
  it('declares injured assignable and the derived lock', () => {
    expect(QUEST_ELIGIBILITY.assignableStatuses).toContain('injured');
    expect(QUEST_ELIGIBILITY.expeditionLocksResident).toBe(true);
  });
});
