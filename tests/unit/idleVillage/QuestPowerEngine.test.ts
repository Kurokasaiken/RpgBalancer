import { describe, it, expect } from 'vitest';
import {
  calculateResidentPower,
  calculatePartyPower,
  calculateQuestDifficulty,
  calculatePowerRatio,
  getOutcomeDistribution,
  rollQuestOutcome,
  resolvePartyConsequences,
  resolveQuestPower,
  DEFAULT_QUEST_POWER_RULES,
  QUEST_OUTCOMES,
  type QuestOutcome,
} from '@/engine/game/idleVillage/QuestPowerEngine';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResident(overrides: Partial<ResidentState> = {}): ResidentState {
  return {
    id: 'test-resident',
    status: 'available',
    fatigue: 0,
    isHero: false,
    isInjured: false,
    currentHp: 200,
    maxHp: 200,
    survivalCount: 0,
    survivalScore: 0,
    statSnapshot: { hp: 200, damage: 30, agility: 50 },
    ...overrides,
  } as ResidentState;
}

function makeActivity(overrides: Partial<ActivityDefinition> = {}): ActivityDefinition {
  return {
    id: 'quest-test',
    label: 'Test Quest',
    description: 'A test quest',
    tags: ['quest'],
    slotTags: ['village'],
    resolutionEngineId: 'quest_combat',
    durationFormula: '60',
    level: 1,
    dangerRating: 2,
    maxSlots: 3,
    ...overrides,
  } as ActivityDefinition;
}

const rules = DEFAULT_QUEST_POWER_RULES;

/** Deterministic RNG that always returns the same value */
const fixedRng = (value: number) => () => value;

// ---------------------------------------------------------------------------
// calculateResidentPower
// ---------------------------------------------------------------------------

describe('calculateResidentPower', () => {
  it('sums weighted stats correctly', () => {
    const resident = makeResident({
      statSnapshot: { hp: 200, damage: 30 },
    });
    // hp: 200 * 0.01 = 2, damage: 30 * 0.04 = 1.2 → total = 3.2
    const power = calculateResidentPower(resident, rules);
    expect(power).toBeCloseTo(3.2, 2);
  });

  it('applies hero multiplier', () => {
    const normal = makeResident({ statSnapshot: { hp: 200, damage: 30 } });
    const hero = makeResident({ statSnapshot: { hp: 200, damage: 30 }, isHero: true });
    const normalPower = calculateResidentPower(normal, rules);
    const heroPower = calculateResidentPower(hero, rules);
    expect(heroPower).toBeCloseTo(normalPower * rules.heroPowerMultiplier, 2);
  });

  it('applies fatigue penalty', () => {
    const rested = makeResident({ fatigue: 0, statSnapshot: { hp: 200 } });
    const tired = makeResident({ fatigue: 80, statSnapshot: { hp: 200 } });
    const restedPower = calculateResidentPower(rested, rules);
    const tiredPower = calculateResidentPower(tired, rules);
    expect(tiredPower).toBeLessThan(restedPower);
    // 80 * 0.005 = 0.4 → 60% of original
    expect(tiredPower).toBeCloseTo(restedPower * 0.6, 2);
  });

  it('applies injury penalty', () => {
    const healthy = makeResident({ statSnapshot: { hp: 200 } });
    const injured = makeResident({ statSnapshot: { hp: 200 }, isInjured: true });
    const healthyPower = calculateResidentPower(healthy, rules);
    const injuredPower = calculateResidentPower(injured, rules);
    expect(injuredPower).toBeCloseTo(healthyPower * rules.injuryPowerMultiplier, 2);
  });

  it('returns 0 for empty stats', () => {
    const empty = makeResident({ statSnapshot: {} });
    expect(calculateResidentPower(empty, rules)).toBe(0);
  });

  it('returns 0 for undefined statSnapshot', () => {
    const noStats = makeResident({ statSnapshot: undefined });
    expect(calculateResidentPower(noStats, rules)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculatePartyPower
// ---------------------------------------------------------------------------

describe('calculatePartyPower', () => {
  it('sums individual powers', () => {
    const r1 = makeResident({ id: 'r1', statSnapshot: { hp: 200, damage: 30 } });
    const r2 = makeResident({ id: 'r2', statSnapshot: { hp: 100, damage: 20 } });
    const p1 = calculateResidentPower(r1, rules);
    const p2 = calculateResidentPower(r2, rules);
    expect(calculatePartyPower([r1, r2], rules)).toBeCloseTo(p1 + p2, 2);
  });

  it('returns 0 for empty party', () => {
    expect(calculatePartyPower([], rules)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateQuestDifficulty
// ---------------------------------------------------------------------------

describe('calculateQuestDifficulty', () => {
  it('scales with level', () => {
    const d1 = calculateQuestDifficulty(1, 0, rules);
    const d2 = calculateQuestDifficulty(2, 0, rules);
    expect(d2).toBe(d1 * 2);
  });

  it('scales with danger rating', () => {
    const d0 = calculateQuestDifficulty(1, 0, rules);
    const d2 = calculateQuestDifficulty(1, 2, rules);
    // d2 = basePowerPerLevel * 1 * (1 + 2 * 0.25) = 5 * 1.5 = 7.5
    expect(d2).toBeCloseTo(d0 * 1.5, 2);
  });

  it('matches formula: basePowerPerLevel * level * (1 + danger * dangerScaling)', () => {
    const result = calculateQuestDifficulty(3, 4, rules);
    const expected = rules.basePowerPerLevel * 3 * (1 + 4 * rules.dangerScaling);
    expect(result).toBeCloseTo(expected, 5);
  });
});

// ---------------------------------------------------------------------------
// getOutcomeDistribution
// ---------------------------------------------------------------------------

describe('getOutcomeDistribution', () => {
  it('returns high-power distribution for ratio >= 2.0', () => {
    const dist = getOutcomeDistribution(2.5, rules);
    expect(dist.perfect).toBe(60);
    expect(dist.deadly).toBe(0);
  });

  it('returns mid distribution for ratio ~1.0', () => {
    const dist = getOutcomeDistribution(1.0, rules);
    expect(dist.perfect).toBe(10);
    expect(dist.success).toBe(35);
  });

  it('returns weak distribution for ratio < 0.7', () => {
    const dist = getOutcomeDistribution(0.3, rules);
    expect(dist.perfect).toBe(0);
    expect(dist.deadly).toBe(40);
  });

  it('returns fallback for ratio exactly 0', () => {
    const dist = getOutcomeDistribution(0, rules);
    expect(dist).toBeDefined();
    expect(dist.deadly).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// rollQuestOutcome
// ---------------------------------------------------------------------------

describe('rollQuestOutcome', () => {
  it('returns first outcome when rng = 0', () => {
    const dist = { perfect: 50, success: 30, partial: 15, fail: 5, deadly: 0 };
    expect(rollQuestOutcome(dist, fixedRng(0))).toBe('perfect');
  });

  it('returns last weighted outcome when rng approaches 1', () => {
    const dist = { perfect: 0, success: 0, partial: 0, fail: 0, deadly: 100 };
    expect(rollQuestOutcome(dist, fixedRng(0.5))).toBe('deadly');
  });

  it('returns fail for empty distribution', () => {
    const dist = { perfect: 0, success: 0, partial: 0, fail: 0, deadly: 0 };
    expect(rollQuestOutcome(dist, fixedRng(0.5))).toBe('fail');
  });

  it('produces all outcomes over many rolls', () => {
    const dist = { perfect: 20, success: 20, partial: 20, fail: 20, deadly: 20 };
    const seen = new Set<QuestOutcome>();
    for (let i = 0; i < 100; i++) {
      const rng = () => i / 100;
      seen.add(rollQuestOutcome(dist, rng));
    }
    expect(seen.size).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// resolvePartyConsequences
// ---------------------------------------------------------------------------

describe('resolvePartyConsequences', () => {
  it('returns no consequences for perfect outcome', () => {
    const party = [makeResident({ id: 'r1' }), makeResident({ id: 'r2' })];
    const results = resolvePartyConsequences(party, 'perfect', rules, fixedRng(0.99));
    expect(results.every((r) => r.consequence === 'none')).toBe(true);
  });

  it('can produce deaths for deadly outcome', () => {
    const party = [makeResident({ id: 'r1' })];
    // deathChance for deadly = 0.15, rng = 0.1 → death
    const results = resolvePartyConsequences(party, 'deadly', rules, fixedRng(0.1));
    expect(results[0].consequence).toBe('dead');
  });

  it('can produce injuries for fail outcome', () => {
    const party = [makeResident({ id: 'r1' })];
    // deathChance for fail = 0.05, injuryChance = 0.40
    // rng = 0.1 → no death (0.1 >= 0.05), then injury roll 0.1 < 0.40 → injured
    const results = resolvePartyConsequences(party, 'fail', rules, fixedRng(0.1));
    expect(results[0].consequence).toBe('injured');
  });

  it('processes each resident independently', () => {
    const party = [
      makeResident({ id: 'r1' }),
      makeResident({ id: 'r2' }),
      makeResident({ id: 'r3' }),
    ];
    let callCount = 0;
    const sequentialRng = () => {
      // r1: death=0.01 (<0.15 → dead), skip injury
      // r2: death=0.99 (>=0.15), injury=0.01 (<0.70 → injured)
      // r3: death=0.99 (>=0.15), injury=0.99 (>=0.70 → none)
      const values = [0.01, 0.99, 0.01, 0.99, 0.99];
      return values[callCount++ % values.length];
    };
    const results = resolvePartyConsequences(party, 'deadly', rules, sequentialRng);
    expect(results[0].consequence).toBe('dead');
    expect(results[1].consequence).toBe('injured');
    expect(results[2].consequence).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// resolveQuestPower (full pipeline)
// ---------------------------------------------------------------------------

describe('resolveQuestPower', () => {
  it('produces valid result with all fields', () => {
    const party = [makeResident({ statSnapshot: { hp: 200, damage: 30 } })];
    const activity = makeActivity({ level: 1, dangerRating: 0 });
    const result = resolveQuestPower(party, activity, rules, fixedRng(0.5));

    expect(result.partyPower).toBeGreaterThan(0);
    expect(result.questDifficulty).toBeGreaterThan(0);
    expect(result.powerRatio).toBeGreaterThan(0);
    expect(QUEST_OUTCOMES).toContain(result.outcome);
    expect(result.rewardMultiplier).toBeGreaterThanOrEqual(0);
    expect(result.consequences).toHaveLength(1);
  });

  it('stronger party gets better outcomes on average', () => {
    const weakParty = [makeResident({ statSnapshot: { hp: 50, damage: 5 } })];
    const strongParty = [
      makeResident({ id: 'r1', statSnapshot: { hp: 300, damage: 50 }, isHero: true }),
      makeResident({ id: 'r2', statSnapshot: { hp: 250, damage: 40 } }),
    ];
    const activity = makeActivity({ level: 1, dangerRating: 2 });

    // Aggregate outcomes
    const outcomeScores: Record<QuestOutcome, number> = { perfect: 4, success: 3, partial: 2, fail: 1, deadly: 0 };
    let weakScore = 0;
    let strongScore = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      const rng = () => Math.random();
      weakScore += outcomeScores[resolveQuestPower(weakParty, activity, rules, rng).outcome];
      strongScore += outcomeScores[resolveQuestPower(strongParty, activity, rules, rng).outcome];
    }
    expect(strongScore / N).toBeGreaterThan(weakScore / N);
  });

  it('handles empty party gracefully', () => {
    const activity = makeActivity({ level: 1, dangerRating: 1 });
    const result = resolveQuestPower([], activity, rules, fixedRng(0.5));
    expect(result.partyPower).toBe(0);
    expect(result.powerRatio).toBe(0);
    // Empty party should get bad outcomes
    expect(['fail', 'deadly']).toContain(result.outcome);
  });

  it('uses activity level and dangerRating from config', () => {
    const party = [makeResident({ statSnapshot: { hp: 200, damage: 30 } })];
    const easy = makeActivity({ level: 1, dangerRating: 0 });
    const hard = makeActivity({ level: 3, dangerRating: 4 });

    const easyResult = resolveQuestPower(party, easy, rules, fixedRng(0.5));
    const hardResult = resolveQuestPower(party, hard, rules, fixedRng(0.5));

    expect(easyResult.powerRatio).toBeGreaterThan(hardResult.powerRatio);
    expect(easyResult.questDifficulty).toBeLessThan(hardResult.questDifficulty);
  });
});
