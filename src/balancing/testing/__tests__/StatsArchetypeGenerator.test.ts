import { describe, expect, test } from 'vitest';
import { DEFAULT_CONFIG } from '../../config/defaultConfig';
import { BASELINE_STATS } from '../../baseline';
import { getStatWeight } from '../../statWeights';
import { getStatCurveFactor } from '../../statCurves';
import { StatsArchetypeGenerator, isStressTestCandidate } from '../StressTestArchetypeGenerator';
import type { StatBlock } from '../../types';
import { DEFAULT_STATS } from '../../types';

// Helper: gather the exact set of stats the generator should consider
const getCandidateStatIds = () =>
  Object.values(DEFAULT_CONFIG.stats)
    .filter(isStressTestCandidate)
    .map((s) => s.id);

describe('StatsArchetypeGenerator', () => {
  const tiers = [25, 50, 75];
  const candidateIds = getCandidateStatIds();
  const generator = new StatsArchetypeGenerator(DEFAULT_CONFIG);

  test('generateSingleStatArchetypes creates statsArchetypes for each non-derived stat and tier', () => {
    const singles = generator.generateSingleStatArchetypes(tiers);

    // n stats × 3 tiers
    expect(singles.length).toBe(candidateIds.length * tiers.length);

    for (const a of singles) {
      expect(a.testedStats).toHaveLength(1);
      expect(candidateIds).toContain(a.testedStats[0]);
      expect(tiers).toContain(a.pointsPerStat);
    }
  });

  test('generatePairStatArchetypes creates C(n,2) combinations per tier', () => {
    const pairs = generator.generatePairStatArchetypes(tiers);
    const n = candidateIds.length;
    const expectedPerTier = (n * (n - 1)) / 2;
    expect(pairs.length).toBe(expectedPerTier * tiers.length);

    for (const a of pairs) {
      expect(a.testedStats).toHaveLength(2);
      const [s1, s2] = a.testedStats;
      expect(candidateIds).toContain(s1);
      expect(candidateIds).toContain(s2);
      expect(s1).not.toBe(s2);
      expect(tiers).toContain(a.pointsPerStat);
    }
  });

  test('baseline stats are not mutated by generators', () => {
    const snapshot = JSON.parse(JSON.stringify(BASELINE_STATS));

    // Run both generators
    generator.generateSingleStatArchetypes([25]);
    generator.generatePairStatArchetypes([25]);

    expect(BASELINE_STATS).toEqual(snapshot);
  });

  const buildGeneratorBaseline = (config = DEFAULT_CONFIG): StatBlock => {
    const baseline = JSON.parse(JSON.stringify(DEFAULT_STATS)) as StatBlock;
    Object.values(config.stats).forEach((stat) => {
      if (stat.isDerived || typeof stat.formula === 'string') return;
      const key = stat.id as keyof StatBlock;
      if (key in baseline) {
        (baseline as any)[key] = stat.defaultValue;
      }
    });
    return baseline;
  };

  test('single-stat archetype applies correct delta based on getStatWeight', () => {
    const pointsPerStat = 25;
    const singles = generator.generateSingleStatArchetypes([pointsPerStat]);
    const generatorBaseline = buildGeneratorBaseline(DEFAULT_CONFIG);

    // Pick a couple of well-known stats that exist in StatBlock
    const candidates = ['hp', 'damage', 'txc', 'evasion'];

    for (const statId of candidates) {
      const archetype = singles.find(
        (a) => a.testedStats[0] === statId && a.pointsPerStat === pointsPerStat,
      );
      if (!archetype) continue; // Stat might be missing from DEFAULT_CONFIG

      const weight = DEFAULT_CONFIG.stats[statId]?.weight ?? getStatWeight(statId);
      const baselineValue = (generatorBaseline as any)[statId] ?? 0;
      const curveFactor = getStatCurveFactor(statId, baselineValue);
      const effectiveWeight = curveFactor !== 0 ? weight / curveFactor : weight;
      const expectedDelta = effectiveWeight * pointsPerStat;
      const configStat = DEFAULT_CONFIG.stats[statId];
      const actualValue = (archetype.stats as any)[statId];

      expect(actualValue).toBeCloseTo(baselineValue + expectedDelta, 5);
    }
  });

  test('isStressTestCandidate respects exclusion flags', () => {
    const template = DEFAULT_CONFIG.stats.hp;
    expect(template).toBeDefined();

    const buildStat = (mutator?: (stat: typeof template) => void) => {
      const stat = JSON.parse(JSON.stringify(template));
      stat.id = 'testStress';
      stat.label = 'Test Stress Stat';
      stat.baseStat = undefined;
      stat.isHidden = false;
      stat.isPenalty = false;
      stat.isDetrimental = undefined;
      stat.isDerived = false;
      delete stat.formula;
      mutator?.(stat);
      if (stat.baseStat === undefined) {
        stat.baseStat = !stat.isDerived && !stat.isPenalty;
      }
      if (stat.isDetrimental === undefined) {
        stat.isDetrimental = !!stat.isPenalty;
      }
      return stat;
    };

    expect(isStressTestCandidate(buildStat())).toBe(true);
    expect(isStressTestCandidate(buildStat((s) => (s.isHidden = true)))).toBe(false);
    expect(isStressTestCandidate(buildStat((s) => (s.baseStat = false)))).toBe(false);
    expect(isStressTestCandidate(buildStat((s) => (s.isPenalty = true)))).toBe(false);
    expect(isStressTestCandidate(buildStat((s) => (s.isDetrimental = true)))).toBe(false);
    expect(
      isStressTestCandidate(
        buildStat((s) => {
          s.isDerived = true;
          s.formula = 'hp + damage';
        }),
      ),
    ).toBe(false);
  });
});
