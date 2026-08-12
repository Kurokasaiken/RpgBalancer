import { describe, it, expect } from 'vitest';
import {
  applyConsumableRiskEffects,
  buildAstrolabeSkillsForPhase,
  buildQuestMilestones,
  isPassingVerdict,
  resolveMilestoneWithoutAnimation,
  resolvePhaseStatTags,
  resolveQuestOutcomeTier,
  sumPartyStat,
} from '@/engine/game/idleVillage/questMilestones';
import {
  questPhaseDurationMs,
  questTotalDurationMs,
  DEFAULT_QUEST_TIME_SCALE,
} from '@/balancing/config/idleVillage/quests/questTimeScale';
import { resolvePhaseDifficulty } from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import { defaultQuestBlueprints } from '@/balancing/config/idleVillage/quests/questBlueprints';
import type { QuestPhase } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

const resident = (id: string, stats: Record<string, number>): ResidentState =>
  ({ id, statSnapshot: stats } as unknown as ResidentState);

const phase = (over: Partial<QuestPhase> = {}): QuestPhase =>
  ({
    id: 'p1',
    title: 'Phase',
    type: 'check',
    durationValue: 1,
    durationUnits: 'hours',
    copy: { summary: '', narrative: '', callToAction: '' },
    ...over,
  }) as QuestPhase;

describe('buildQuestMilestones', () => {
  it('spaces four milestones at 25/50/75/100 percent', () => {
    expect(buildQuestMilestones(8000, 4)).toEqual([2000, 4000, 6000, 8000]);
  });

  it('generalises equal spacing to any phase count', () => {
    expect(buildQuestMilestones(6000, 3)).toEqual([2000, 4000, 6000]);
    expect(buildQuestMilestones(1000, 2)).toEqual([500, 1000]);
  });

  it('lands the final milestone exactly on the total duration', () => {
    const milestones = buildQuestMilestones(7000, 3);
    expect(milestones[milestones.length - 1]).toBe(7000);
  });

  it('returns nothing for a non-positive duration or zero milestones', () => {
    expect(buildQuestMilestones(0, 4)).toEqual([]);
    expect(buildQuestMilestones(-5, 4)).toEqual([]);
    expect(buildQuestMilestones(1000, 0)).toEqual([]);
  });
});

describe('quest duration comes from the authored phases', () => {
  it('converts each unit through the configured scale', () => {
    expect(questPhaseDurationMs({ durationValue: 2, durationUnits: 'hours' })).toBe(
      2 * DEFAULT_QUEST_TIME_SCALE.msPerHour,
    );
    expect(questPhaseDurationMs({ durationValue: 3, durationUnits: 'days' })).toBe(
      3 * DEFAULT_QUEST_TIME_SCALE.msPerDay,
    );
    expect(questPhaseDurationMs({ durationValue: 5, durationUnits: 'ticks' })).toBe(
      5 * DEFAULT_QUEST_TIME_SCALE.msPerTick,
    );
  });

  it('sums the real quest_city_rats blueprint to 2h + 3h + 1h', () => {
    const blueprint = defaultQuestBlueprints.quest_city_rats;
    expect(blueprint.phases).toHaveLength(3);
    expect(questTotalDurationMs(blueprint.phases)).toBe(6 * DEFAULT_QUEST_TIME_SCALE.msPerHour);
  });

  it('falls back when a quest declares no phases', () => {
    expect(questTotalDurationMs([])).toBe(DEFAULT_QUEST_TIME_SCALE.fallbackTotalMs);
  });

  it('ignores negative authored durations rather than shortening the quest', () => {
    expect(questPhaseDurationMs({ durationValue: -4, durationUnits: 'hours' })).toBe(0);
  });
});

describe('resolvePhaseStatTags', () => {
  it('reads the trial shape first', () => {
    const tags = resolvePhaseStatTags(
      phase({ requirements: { requiredStatTags: ['edge', 'ward'] } }),
    );
    expect(tags).toEqual(['edge', 'ward']);
  });

  it('falls back to a phase statRequirement, flattening allOf and anyOf', () => {
    const tags = resolvePhaseStatTags(
      phase({
        requirements: {
          statRequirement: { label: 'Scout', allOf: ['lantern'], anyOf: ['clarity'] },
        },
      } as Partial<QuestPhase>),
    );
    expect(tags).toEqual(['lantern', 'clarity']);
  });

  it('falls back to the activity requirement when the phase declares none', () => {
    const tags = resolvePhaseStatTags(phase({ requirements: { encounterId: 'rats' } }), {
      label: 'Veteran',
      allOf: ['edge'],
    });
    expect(tags).toEqual(['edge']);
  });

  it('deduplicates tags declared in more than one place', () => {
    const tags = resolvePhaseStatTags(
      phase({ requirements: { requiredStatTags: ['edge'] } }),
      { label: 'x', allOf: ['edge'], anyOf: ['edge'] },
    );
    expect(tags).toEqual(['edge']);
  });
});

describe('sumPartyStat', () => {
  it('sums the stat across every assigned resident', () => {
    const party = [resident('a', { edge: 10 }), resident('b', { edge: 25 })];
    expect(sumPartyStat(party, 'edge')).toBe(35);
  });

  it('treats residents without the stat as zero', () => {
    const party = [resident('a', { edge: 10 }), resident('b', { ward: 40 })];
    expect(sumPartyStat(party, 'edge')).toBe(10);
  });

  it('returns zero for an empty party', () => {
    expect(sumPartyStat([], 'edge')).toBe(0);
  });
});

describe('buildAstrolabeSkillsForPhase', () => {
  it('produces one skill per tested stat, carrying the summed party value', () => {
    const skills = buildAstrolabeSkillsForPhase({
      phase: phase({ requirements: { requiredStatTags: ['edge', 'ward'] } }),
      residents: [resident('a', { edge: 20, ward: 5 }), resident('b', { edge: 15, ward: 10 })],
    });
    expect(skills.map((s) => s.name)).toEqual(['edge', 'ward']);
    expect(skills[0].stat).toBe(35);
    expect(skills[1].stat).toBe(15);
  });

  it('never hands the astrolabe an unwinnable zero for an empty slot', () => {
    const skills = buildAstrolabeSkillsForPhase({
      phase: phase({ requirements: { requiredStatTags: ['edge'] } }),
      residents: [],
    });
    expect(skills[0].stat).toBeGreaterThan(0);
  });

  it('clamps a very strong party to the configured ceiling', () => {
    const skills = buildAstrolabeSkillsForPhase({
      phase: phase({ requirements: { requiredStatTags: ['edge'] } }),
      residents: [resident('a', { edge: 400 })],
    });
    expect(skills[0].stat).toBe(95);
  });

  it('still rolls when a phase declares no stat tags at all', () => {
    const skills = buildAstrolabeSkillsForPhase({
      phase: phase({ requirements: undefined, title: 'Sigilla le Bocche' }),
      residents: [resident('a', { hp: 100 })],
    });
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe('Sigilla le Bocche');
  });

  it('takes difficulty from the authored label over the blueprint tier', () => {
    const skills = buildAstrolabeSkillsForPhase({
      phase: phase({
        type: 'check',
        requirements: { requiredStatTags: ['edge'], difficultyLabel: 'estrema' },
      }),
      residents: [resident('a', { edge: 10 })],
      blueprintDifficulty: 'story',
    });
    expect(skills[0].difficulty).toBe(80);
  });

  it('derives difficulty from the blueprint tier plus the phase type', () => {
    const skills = buildAstrolabeSkillsForPhase({
      phase: phase({ type: 'fight', requirements: { requiredStatTags: ['edge'] } }),
      residents: [resident('a', { edge: 10 })],
      blueprintDifficulty: 'dangerous',
    });
    // dangerous (60) + fight (+10)
    expect(skills[0].difficulty).toBe(70);
  });
});

describe('resolvePhaseDifficulty', () => {
  it('clamps to the configured ceiling', () => {
    expect(
      resolvePhaseDifficulty({ difficultyLabel: 'estrema', phaseType: 'fight' }),
    ).toBeLessThanOrEqual(95);
  });

  it('falls back to the default when nothing resolves', () => {
    expect(resolvePhaseDifficulty({ blueprintDifficulty: 'unknown-tier' })).toBe(50);
  });

  it('makes dialogue easier than a fight at the same tier', () => {
    const fight = resolvePhaseDifficulty({ blueprintDifficulty: 'skirmish', phaseType: 'fight' });
    const talk = resolvePhaseDifficulty({ blueprintDifficulty: 'skirmish', phaseType: 'dialogue' });
    expect(talk).toBeLessThan(fight);
  });
});

describe('applyConsumableRiskEffects', () => {
  it('subtracts the deltas of every spent consumable', () => {
    const risk = applyConsumableRiskEffects({ injuryChance: 40, deathChance: 20 }, [
      { effect: { injuryChanceDelta: -15 } },
      { effect: { deathChanceDelta: -10 } },
    ]);
    expect(risk).toEqual({ injuryChance: 25, deathChance: 10 });
  });

  it('clamps at zero instead of inverting a risk', () => {
    const risk = applyConsumableRiskEffects({ injuryChance: 5, deathChance: 2 }, [
      { effect: { injuryChanceDelta: -50, deathChanceDelta: -50 } },
    ]);
    expect(risk).toEqual({ injuryChance: 0, deathChance: 0 });
  });

  it('is a no-op when nothing is spent', () => {
    expect(applyConsumableRiskEffects({ injuryChance: 28, deathChance: 12 }, [])).toEqual({
      injuryChance: 28,
      deathChance: 12,
    });
  });
});

describe('resolveMilestoneWithoutAnimation', () => {
  const skills = [{ name: 'edge', stat: 60, difficulty: 50 }];

  it('passes on a low roll and fails on a high one', () => {
    const pass = resolveMilestoneWithoutAnimation(
      { skills, risk: { injuryChance: 0, deathChance: 0 } },
      undefined,
      () => 0.01,
    );
    expect(isPassingVerdict(pass.verdict)).toBe(true);

    const fail = resolveMilestoneWithoutAnimation(
      { skills, risk: { injuryChance: 0, deathChance: 0 } },
      undefined,
      () => 0.94,
    );
    expect(isPassingVerdict(fail.verdict)).toBe(false);
  });

  it('reports a critical failure at the top of the range', () => {
    const result = resolveMilestoneWithoutAnimation(
      { skills, risk: { injuryChance: 0, deathChance: 0 } },
      undefined,
      () => 0.99,
    );
    expect(result.verdict).toBe('epicfail');
  });

  it('kills before wounding when the risk roll is lowest', () => {
    const result = resolveMilestoneWithoutAnimation(
      { skills, risk: { injuryChance: 50, deathChance: 50 } },
      undefined,
      () => 0,
    );
    expect(result.dead).toBe(true);
    expect(result.wounded).toBe(false);
  });

  it('leaves the party unharmed when the phase carries no risk', () => {
    const result = resolveMilestoneWithoutAnimation(
      { skills, risk: { injuryChance: 0, deathChance: 0 } },
      undefined,
      () => 0,
    );
    expect(result.dead).toBe(false);
    expect(result.wounded).toBe(false);
  });

  it('drives the phase from the weakest skill of the party', () => {
    const result = resolveMilestoneWithoutAnimation(
      {
        skills: [
          { name: 'strong', stat: 90, difficulty: 20 },
          { name: 'weak', stat: 10, difficulty: 80 },
        ],
        risk: { injuryChance: 0, deathChance: 0 },
      },
      undefined,
      () => 0.5,
    );
    expect(result.skillName).toBe('weak');
  });

  it('is deterministic for a given random source', () => {
    const run = () =>
      resolveMilestoneWithoutAnimation(
        { skills, risk: { injuryChance: 10, deathChance: 5 } },
        undefined,
        () => 0.42,
      );
    expect(run()).toEqual(run());
  });
});

describe('resolveQuestOutcomeTier', () => {
  const result = (verdict: string, dead = false) =>
    ({ verdict, roll: 0, riskRoll: 0, skillIndex: 0, skillName: '', wounded: false, dead });

  it('never announces a win over phases that all failed', () => {
    expect(resolveQuestOutcomeTier([result('fail'), result('fail'), result('fail')])).toBe('fail');
  });

  it('never announces a loss over phases that all passed', () => {
    expect(resolveQuestOutcomeTier([result('win'), result('bigwin'), result('almost')])).toBe(
      'perfect',
    );
  });

  it('downgrades a clean sweep to success when someone died', () => {
    expect(resolveQuestOutcomeTier([result('win'), result('win', true)])).toBe('success');
  });

  it('calls a total failure with a casualty a disaster', () => {
    expect(resolveQuestOutcomeTier([result('fail'), result('fail', true)])).toBe('deadly');
  });

  it('treats half or more passed as a success', () => {
    expect(resolveQuestOutcomeTier([result('win'), result('fail')])).toBe('success');
    expect(resolveQuestOutcomeTier([result('win'), result('win'), result('fail')])).toBe('success');
  });

  it('treats less than half passed as partial', () => {
    expect(resolveQuestOutcomeTier([result('win'), result('fail'), result('fail')])).toBe('partial');
  });

  it('ignores unresolved phases rather than counting them as failures', () => {
    expect(resolveQuestOutcomeTier([result('win'), null, null])).toBe('perfect');
  });

  it('reports a failure when nothing resolved at all', () => {
    expect(resolveQuestOutcomeTier([])).toBe('fail');
    expect(resolveQuestOutcomeTier([null, null])).toBe('fail');
  });
});

describe('isPassingVerdict', () => {
  it('treats a near miss as a pass and a plain failure as a fail', () => {
    expect(['bigwin', 'win', 'almost'].every(isPassingVerdict)).toBe(true);
    expect(['fail', 'epicfail'].some(isPassingVerdict)).toBe(false);
  });
});
