import { describe, it, expect } from 'vitest';
import {
  buildMissionInput,
  questOutcomeDistribution,
  type MissionDraft,
} from '@/engine/game/idleVillage/missionPlannerEngine';
import {
  aliveMaskFromStates,
  buildSessionMissionInput,
  initialMemberStates,
  memberConsequencesFromStates,
  missionRunRewardMultiplier,
  resolveMissionPhase,
  resolveMissionRun,
} from '@/engine/game/idleVillage/missionResolver';
import type { MissionPhaseSpec } from '@/engine/game/idleVillage/missionPlannerMath';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { defaultQuestBlueprints } from '@/balancing/config/idleVillage/quests/questBlueprints';
import { DEFAULT_QUEST_SKILL_CHECK_CONFIG } from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import { createSeededRng } from '@/balancing/utils/archmage/seededRng';

const resident = (id: string, stats: Record<string, number>): ResidentState =>
  ({ id, statSnapshot: stats } as unknown as ResidentState);

const phase = (over: Partial<MissionPhaseSpec> = {}): MissionPhaseSpec => ({
  phaseId: 'p1',
  difficulty: 60,
  checkStatTags: ['strength'],
  baseInjuryChance: 0,
  baseDeathChance: 0,
  durationUnits: 1,
  ...over,
});

const draft = (over: Partial<MissionDraft> = {}): MissionDraft => ({
  members: [{ resident: resident('a', { strength: 15 }), slotIndex: 0 }],
  phases: [phase()],
  itemCatalog: defaultQuestItems,
  ...over,
});

describe('resolveMissionPhase', () => {
  it('rolls one risk check per living member and excludes dead members', () => {
    const input = buildMissionInput(
      draft({
        members: [
          { resident: resident('a', { strength: 15 }), slotIndex: 0 },
          { resident: resident('b', { strength: 15 }), slotIndex: 1 },
        ],
        phases: [phase({ baseDeathChance: 50 })],
      }),
    );
    // Member 'a' (bit 0) is already dead → only 'b' rolls.
    const result = resolveMissionPhase(input, 0, 0b10, DEFAULT_QUEST_SKILL_CHECK_CONFIG, () => 0.99);
    expect(result.memberRolls.map((r) => r.residentId)).toEqual(['b']);
    expect(result.aliveMaskAfter).toBe(0b10);
  });

  it('marks dead members out of the mask and leaves injured members in', () => {
    const input = buildMissionInput(
      draft({
        members: [
          { resident: resident('a', { strength: 5 }), slotIndex: 0 },
          { resident: resident('b', { strength: 5 }), slotIndex: 1 },
        ],
        phases: [phase({ baseDeathChance: 50, baseInjuryChance: 50 })],
      }),
    );
    // stats 5×2 members ×mult 4 = 40 vs diff 60 → bound 30 → roll 21 = win
    // (bigwin would need ≤ 6); then a: riskRoll 10 → dead (≤50);
    // b: riskRoll 60 → wounded (50 < 60 ≤ 100).
    const seq = [0.2, 0.09, 0.59];
    let i = 0;
    const rng = () => seq[i++];
    const result = resolveMissionPhase(input, 0, 0b11, DEFAULT_QUEST_SKILL_CHECK_CONFIG, rng);
    expect(result.verdict).toBe('win');
    expect(result.passed).toBe(true);
    expect(result.memberRolls).toEqual([
      { residentId: 'a', riskRoll: 10, dead: true, wounded: false },
      { residentId: 'b', riskRoll: 60, dead: false, wounded: true },
    ]);
    expect(result.aliveMaskAfter).toBe(0b10); // only 'b' survives
  });
});

describe('resolveMissionRun', () => {
  it('wipe forces deadly regardless of collected verdicts', () => {
    const input = buildMissionInput(
      draft({ phases: [phase({ baseDeathChance: 100 })] }),
    );
    const run = resolveMissionRun(input, DEFAULT_QUEST_SKILL_CHECK_CONFIG, () => 0.0);
    expect(run.wiped).toBe(true);
    expect(run.tier).toBe('deadly');
    expect(run.memberOutcomes).toEqual({ a: 'dead' });
  });

  it('a dead member stops rolling in later phases (dependence)', () => {
    const input = buildMissionInput(
      draft({
        members: [
          {
            resident: resident('doomed', { strength: 10 }),
            slotIndex: 0,
            deathChanceDelta: 100,
          },
          { resident: resident('lucky', { strength: 0 }), slotIndex: 1 },
        ],
        phases: [phase({ phaseId: 'p1' }), phase({ phaseId: 'p2' })],
      }),
    );
    const run = resolveMissionRun(input, DEFAULT_QUEST_SKILL_CHECK_CONFIG, createSeededRng(7));
    expect(run.phases).toHaveLength(2);
    expect(run.phases[0].memberRolls.map((r) => r.residentId)).toEqual(['doomed', 'lucky']);
    expect(run.phases[1].memberRolls.map((r) => r.residentId)).toEqual(['lucky']);
    expect(run.memberOutcomes.doomed).toBe('dead');
  });

  it('an injured member keeps rolling (stays in S)', () => {
    const input = buildMissionInput(
      draft({
        members: [{ resident: resident('a', { strength: 15 }), slotIndex: 0 }],
        phases: [
          phase({ phaseId: 'p1', baseInjuryChance: 100 }),
          phase({ phaseId: 'p2' }),
        ],
      }),
    );
    const run = resolveMissionRun(input, DEFAULT_QUEST_SKILL_CHECK_CONFIG, createSeededRng(11));
    expect(run.phases).toHaveLength(2);
    expect(run.phases[1].memberRolls.map((r) => r.residentId)).toEqual(['a']);
    expect(run.memberOutcomes.a).toBe('injured');
    expect(run.wiped).toBe(false);
  });

  it('checkpoint retreat ends the run on the phases played', () => {
    const input = buildMissionInput(
      draft({
        members: [{ resident: resident('a', { strength: 95 }), slotIndex: 0 }],
        phases: [phase({ phaseId: 'p1' }), phase({ phaseId: 'p2' }), phase({ phaseId: 'p3' })],
      }),
    );
    const run = resolveMissionRun(input, DEFAULT_QUEST_SKILL_CHECK_CONFIG, createSeededRng(13), {
      shouldContinue: (cp) => cp.phaseIndex !== 0, // retreat after phase 0
    });
    expect(run.retreated).toBe(true);
    expect(run.phases).toHaveLength(1);
    // classifyTier(1 passed, 1 played, no death) → perfect
    expect(run.tier).toBe('perfect');
  });

  it('samples the same distribution the DP computes (seeded, ±1.5pp)', () => {
    // 2 members / 2 phases with real risk: rich enough that death dependence,
    // cover, almost-band and tier mixing all matter.
    const input = buildMissionInput(
      draft({
        members: [
          {
            resident: resident('vanguard', { strength: 8 }),
            slotIndex: 0,
            loadout: { trinket: 'quest_trinket_guardian_banner' },
          },
          {
            resident: resident('scout', { strength: 6 }),
            slotIndex: 1,
            deathChanceDelta: 5,
          },
        ],
        phases: [
          phase({ phaseId: 'p1', baseDeathChance: 8, baseInjuryChance: 15 }),
          phase({ phaseId: 'p2', baseDeathChance: 12, baseInjuryChance: 20, difficulty: 70 }),
        ],
        consumables: [{ itemId: 'quest_consumable_healing_draught' }],
      }),
    );
    const expected = questOutcomeDistribution(
      draft({
        members: [
          {
            resident: resident('vanguard', { strength: 8 }),
            slotIndex: 0,
            loadout: { trinket: 'quest_trinket_guardian_banner' },
          },
          {
            resident: resident('scout', { strength: 6 }),
            slotIndex: 1,
            deathChanceDelta: 5,
          },
        ],
        phases: [
          phase({ phaseId: 'p1', baseDeathChance: 8, baseInjuryChance: 15 }),
          phase({ phaseId: 'p2', baseDeathChance: 12, baseInjuryChance: 20, difficulty: 70 }),
        ],
        consumables: [{ itemId: 'quest_consumable_healing_draught' }],
      }),
    );

    const rng = createSeededRng(20261001);
    const trials = 10_000;
    const tierCounts: Record<string, number> = {};
    const memberDead: Record<string, number> = {};
    const memberInjured: Record<string, number> = {};
    let passP1 = 0;
    let anyDeath = 0;
    for (let i = 0; i < trials; i += 1) {
      const run = resolveMissionRun(input, DEFAULT_QUEST_SKILL_CHECK_CONFIG, rng);
      tierCounts[run.tier] = (tierCounts[run.tier] ?? 0) + 1;
      Object.entries(run.memberOutcomes).forEach(([id, state]) => {
        if (state === 'dead') memberDead[id] = (memberDead[id] ?? 0) + 1;
        if (state === 'injured') memberInjured[id] = (memberInjured[id] ?? 0) + 1;
      });
      if (run.phases[0]?.passed) passP1 += 1;
      if (run.anyDeath) anyDeath += 1;
    }

    const tol = 0.015;
    expect(Math.abs(passP1 / trials - expected.phases[0].passChance)).toBeLessThanOrEqual(tol);
    expect(Math.abs(anyDeath / trials - expected.aggregate.anyDeath)).toBeLessThanOrEqual(tol);
    expected.members.forEach((member) => {
      expect(
        Math.abs((memberDead[member.residentId] ?? 0) / trials - member.deathChance),
      ).toBeLessThanOrEqual(tol);
      expect(
        Math.abs((memberInjured[member.residentId] ?? 0) / trials - member.injuryChance),
      ).toBeLessThanOrEqual(tol);
    });
    (Object.keys(expected.tiers) as Array<keyof typeof expected.tiers>).forEach((tier) => {
      expect(Math.abs((tierCounts[tier] ?? 0) / trials - expected.tiers[tier])).toBeLessThanOrEqual(
        tol,
      );
    });
  });

  it('rewardMultiplier mirrors the DP formula for the sampled tier', () => {
    const input = buildMissionInput(
      draft({
        consumables: [{ itemId: 'quest_consumable_lucky_coin', qty: 1 }],
        rewardMultipliers: { perfect: 2 },
      }),
    );
    expect(missionRunRewardMultiplier(input, 'perfect')).toBeCloseTo(2 + 0.1, 6);
    expect(missionRunRewardMultiplier(input, 'fail')).toBeCloseTo(1 + 0.1, 6);
  });
});

describe('session helpers', () => {
  it('initialMemberStates/aliveMaskFromStates round-trip the living set', () => {
    const input = buildMissionInput(
      draft({
        members: [
          { resident: resident('a', {}), slotIndex: 0 },
          { resident: resident('b', {}), slotIndex: 1 },
          { resident: resident('c', {}), slotIndex: 2 },
        ],
      }),
    );
    const states = initialMemberStates(input);
    expect(states).toEqual({ a: 'alive', b: 'alive', c: 'alive' });
    expect(aliveMaskFromStates(input, states)).toBe(0b111);
    states.b = 'dead';
    expect(aliveMaskFromStates(input, states)).toBe(0b101);
  });

  it('memberConsequencesFromStates maps to the QuestPowerResult shape', () => {
    expect(
      memberConsequencesFromStates({ a: 'alive', b: 'injured', c: 'dead' }),
    ).toEqual([
      { residentId: 'a', consequence: 'none' },
      { residentId: 'b', consequence: 'injured' },
      { residentId: 'c', consequence: 'dead' },
    ]);
  });

  it('buildSessionMissionInput produces the same input the planner shows', () => {
    const blueprint = defaultQuestBlueprints.quest_city_rats;
    const residentsById = {
      'r-1': resident('r-1', { perception: 6, strength: 3 }),
    };
    const input = buildSessionMissionInput({
      slotBlueprints: [{ id: 'slot0', required: false }],
      assignments: { slot0: 'r-1' },
      loadouts: { 'r-1': { weapon: 'quest_weapon_iron_blade' } },
      consumables: [{ itemId: 'quest_consumable_healing_draught', qty: 1 }],
      residentsById,
      blueprint,
      config: DEFAULT_QUEST_SKILL_CHECK_CONFIG,
    });
    expect(input.members).toHaveLength(1);
    expect(input.members[0].stats.strength).toBe(7); // 3 + 4 blade
    expect(input.phases).toHaveLength(3);
    expect(input.consumables?.[0]?.itemId).toBe('quest_consumable_healing_draught');
  });
});
