import { describe, it, expect } from 'vitest';
import {
  classifyTier,
  computeMissionPreview,
  memberPhaseRisk,
  phasePassChance,
  phaseSuccessBound,
  phaseVerdictCounts,
  phaseWeakestStat,
  type MissionMemberSpec,
  type MissionPhaseSpec,
} from '@/engine/game/idleVillage/missionPlannerMath';

const member = (
  id: string,
  stats: Record<string, number>,
  over: Partial<MissionMemberSpec> = {},
): MissionMemberSpec => ({ residentId: id, slotIndex: 0, stats, ...over });

const phase = (over: Partial<MissionPhaseSpec> = {}): MissionPhaseSpec => ({
  phaseId: 'p1',
  difficulty: 50,
  checkStatTags: ['strength'],
  baseInjuryChance: 0,
  baseDeathChance: 0,
  durationUnits: 1,
  ...over,
});

describe('phaseVerdictCounts / phasePassChance (spec §2.4)', () => {
  it('partitions the 100-roll space exactly', () => {
    const c = phaseVerdictCounts(40);
    expect(c.epicfail + c.bigwin + c.win + c.almost + c.fail).toBe(100);
    expect(c).toEqual({ epicfail: 5, bigwin: 8, win: 32, almost: 10, fail: 45 });
  });

  it('pass = win + bigwin only (almost never passes, rev.3)', () => {
    // stat 50 vs diff 60 → s = 50−60+50 = 40 → pass 0.40; the old rule that
    // counted `almost` would have produced 0.50.
    expect(phasePassChance(50, 60)).toBeCloseTo(0.4);
  });

  it('clamps to success floor/ceiling', () => {
    expect(phasePassChance(0, 95)).toBeCloseTo(0.05); // stat−diff = −95 → floor 5
    expect(phasePassChance(95, 10)).toBeCloseTo(0.95); // ceiling 95
  });

  it('handles p=0 and p=1 boundaries without NaN', () => {
    const p0 = phasePassChance(0, 100);
    const p1 = phasePassChance(100, 0);
    expect(p0).toBeCloseTo(0.05);
    expect(p1).toBeCloseTo(0.95);
  });
});

describe('phaseWeakestStat (spec §2.3)', () => {
  it('uses the weakest tag margin and applies partyStatMult before clamp', () => {
    const members = [member('a', { strength: 10, agility: 30 }), member('b', { strength: 10, agility: 30 })];
    const p = phase({ checkStatTags: ['strength', 'agility'], difficulty: 60 });
    const { stat, tag } = phaseWeakestStat(members, 0b11, p, 1);
    expect(tag).toBe('strength');
    expect(stat).toBe(20);
  });

  it('generic skill scales with alive count', () => {
    const members = [member('a', {}), member('b', {}), member('c', {})];
    const p = phase({ checkStatTags: [] });
    expect(phaseWeakestStat(members, 0b111, p, 1).stat).toBe(15); // 3 × floor 5
    expect(phaseWeakestStat(members, 0b001, p, 1).stat).toBe(5);
  });

  it('never multiplies the generic skill by partyStatMult (spec §2.3)', () => {
    const members = [member('a', {}), member('b', {})];
    const p = phase({ checkStatTags: [] });
    expect(phaseWeakestStat(members, 0b11, p, 10).stat).toBe(10); // still 2 × 5
  });

  it('partyStatMult bridges the scale', () => {
    const members = [member('a', { strength: 15 }), member('b', { strength: 15 })];
    const p = phase({ checkStatTags: ['strength'] });
    expect(phaseWeakestStat(members, 0b11, p, 4).stat).toBe(95); // 30*4=120 → clamped 95
  });
});

describe('memberPhaseRisk (spec §3)', () => {
  it('composes additive deltas and clamps once', () => {
    const p = phase({ baseDeathChance: 10, baseInjuryChance: 20 });
    const m = member('a', {}, { deathChanceDelta: 5, injuryChanceDelta: 10 });
    const r = memberPhaseRisk([m], 0, p, 0b1, [{ itemId: 'potion', deathChanceDelta: -3, injuryChanceDelta: -5 }]);
    expect(r.death).toBeCloseTo(0.12); // 10+5−3
    expect(r.injury).toBeCloseTo(0.25); // 20+10−5
  });

  it('truncates injury so death + injury ≤ 100 (death priority)', () => {
    const p = phase({ baseDeathChance: 60, baseInjuryChance: 80 });
    const r = memberPhaseRisk([member('a', {})], 0, p, 0b1, []);
    expect(r.death).toBeCloseTo(0.6);
    expect(r.injury).toBeCloseTo(0.4); // truncated from 0.8
  });

  it('cover applies to other living members only (D1)', () => {
    const cover = member('guard', {}, { coverDeathChanceDelta: -8 });
    const target = member('worker', {});
    const p = phase({ baseDeathChance: 12 });
    const withCover = memberPhaseRisk([cover, target], 1, p, 0b11, []);
    const providerDead = memberPhaseRisk([cover, target], 1, p, 0b10, []); // guard dead
    const providerOwnRisk = memberPhaseRisk([cover, target], 0, p, 0b11, []);
    expect(withCover.death).toBeCloseTo(0.04); // 12 − 8
    expect(providerDead.death).toBeCloseTo(0.12); // cover ends with provider
    expect(providerOwnRisk.death).toBeCloseTo(0.12); // no self-cover
  });
});

describe('classifyTier (spec §4.2)', () => {
  it('matches the canonical table', () => {
    expect(classifyTier(3, 3, false)).toBe('perfect');
    expect(classifyTier(3, 3, true)).toBe('success');
    expect(classifyTier(0, 3, true)).toBe('deadly');
    expect(classifyTier(0, 3, false)).toBe('fail');
    expect(classifyTier(2, 3, false)).toBe('success'); // ≥50%
    expect(classifyTier(1, 3, false)).toBe('partial');
    expect(classifyTier(0, 0, false)).toBe('fail');
  });
});

describe('computeMissionPreview (spec §4)', () => {
  it('returns the zeroed shape for an empty party', () => {
    const res = computeMissionPreview({ members: [], phases: [phase()] });
    expect(res.tiers.fail).toBe(1);
    expect(res.members).toEqual([]);
    expect(res.questSuccess).toBe(0);
  });

  it('tier distribution sums to 1', () => {
    const res = computeMissionPreview({
      members: [member('a', { strength: 20 }), member('b', { strength: 15 })],
      phases: [phase(), phase({ phaseId: 'p2', baseDeathChance: 10 })],
      partyStatMult: 3,
    });
    const total = Object.values(res.tiers).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it('certain death in phase 1 forces deadly (wipe)', () => {
    const res = computeMissionPreview({
      members: [member('a', { strength: 50 })],
      phases: [phase({ baseDeathChance: 100 }), phase({ phaseId: 'p2' })],
    });
    expect(res.tiers.deadly).toBeCloseTo(1);
    expect(res.questSuccess).toBe(0);
    expect(res.members[0].deathChance).toBe(1);
  });

  it('matches closed-form per-member risk when no cover exists', () => {
    // d=10%, w=20% per phase, 2 identical phases, 1 member:
    // P_dead = 1−(1−d)² ; P_injured = (1−d)² − (1−d−w)² ; P_unscathed = (1−d−w)²
    const d = 0.1;
    const w = 0.2;
    const res = computeMissionPreview({
      members: [member('a', { strength: 0 })],
      phases: [
        phase({ baseDeathChance: 10, baseInjuryChance: 20 }),
        phase({ phaseId: 'p2', baseDeathChance: 10, baseInjuryChance: 20 }),
      ],
    });
    const expectedDead = 1 - (1 - d) ** 2;
    const expectedInjured = (1 - d) ** 2 - (1 - d - w) ** 2;
    const expectedUnscathed = (1 - d - w) ** 2;
    expect(res.members[0].deathChance).toBeCloseTo(expectedDead, 6);
    expect(res.members[0].injuryChance).toBeCloseTo(expectedInjured, 6);
    expect(res.members[0].unscathedChance).toBeCloseTo(expectedUnscathed, 6);
  });

  it('death cascade: losing a member drops later-phase pass chance', () => {
    // Both members carry strength 30; each phase is stat-sum vs diff 60.
    const phases = [
      phase({ checkStatTags: ['strength'], difficulty: 60 }),
      phase({ phaseId: 'p2', checkStatTags: ['strength'], difficulty: 60 }),
    ];
    const casualty = computeMissionPreview({
      members: [
        member('a', { strength: 30 }, { deathChanceDelta: 100 }), // dies in p1
        member('b', { strength: 30 }),
      ],
      phases,
    });
    const intact = computeMissionPreview({
      members: [member('a', { strength: 30 }), member('b', { strength: 30 })],
      phases,
    });
    expect(casualty.members[0].deathChance).toBe(1);
    // p1 = 0.5 (stat 60 vs 60), then b alone at p2 → p = 0.2 (stat 30 vs 60).
    // Success needs ≥1 pass of 2: 1 − 0.5·0.8 = 0.6.
    expect(casualty.questSuccess).toBeCloseTo(0.6, 6);
    // Intact party: p1 = p2 = 0.5 → 1 − 0.5² = 0.75. The dead member's stat
    // genuinely leaves the pool — the cascade is real, not cosmetic.
    expect(intact.questSuccess).toBeCloseTo(0.75, 6);
  });

  it('produces P_surviveThrough and retreat tiers per phase (D2)', () => {
    const res = computeMissionPreview({
      members: [member('a', { strength: 25 }), member('b', { strength: 25 })],
      phases: [phase(), phase({ phaseId: 'p2' }), phase({ phaseId: 'p3' })],
      partyStatMult: 2,
    });
    expect(res.phases).toHaveLength(3);
    res.phases.forEach((p) => {
      const tSum = Object.values(p.retreatTiers).reduce((a, b) => a + b, 0);
      expect(tSum).toBeCloseTo(1, 5);
    });
    expect(res.phases[0].surviveThrough).toBe(1); // no base death chance
  });

  it('is deterministic and reversible: A → A+x → A yields identical outputs', () => {
    const base = {
      members: [member('a', { strength: 12 }), member('b', { strength: 10 })],
      phases: [phase(), phase({ phaseId: 'p2', baseInjuryChance: 15 })],
      partyStatMult: 3,
    };
    const before = computeMissionPreview(base);
    const expanded = computeMissionPreview({
      ...base,
      members: [...base.members, member('c', { strength: 8 })],
      consumables: [{ itemId: 'potion', injuryChanceDelta: -5 }],
    });
    const after = computeMissionPreview(base);
    expect(after).toEqual(before);
    expect(expanded.questSuccess).not.toBe(before.questSuccess);
  });
});
