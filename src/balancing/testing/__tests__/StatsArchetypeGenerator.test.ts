import { describe, expect, test } from 'vitest';
import { DEFAULT_CONFIG } from '../../config/defaultConfig';
import { BASELINE_STATS } from '../../baseline';
import { getStatWeight } from '../../statWeights';
import { StatsArchetypeGenerator, isStressTestCandidate } from '../StressTestArchetypeGenerator';

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

  test('single-stat archetype applies correct delta based on getStatWeight', () => {
    const pointsPerStat = 25;
    const singles = generator.generateSingleStatArchetypes([pointsPerStat]);

    // Pick a couple of well-known stats that exist in StatBlock
    const candidates = ['hp', 'damage', 'txc', 'evasion'];

    for (const statId of candidates) {
      const archetype = singles.find(
        (a) => a.testedStats[0] === statId && a.pointsPerStat === pointsPerStat,
      );
      if (!archetype) continue; // Stat might be missing from DEFAULT_CONFIG

      const weight = getStatWeight(statId);
      const expectedDelta = weight * pointsPerStat;
      const configStat = DEFAULT_CONFIG.stats[statId];
      const baselineValue =
        (configStat && 'defaultValue' in configStat ? configStat.defaultValue : undefined) ??
        (BASELINE_STATS as any)[statId] ??
        0;
      const actualValue = (archetype.stats as any)[statId];

      expect(actualValue).toBeCloseTo(baselineValue + expectedDelta, 5);
    }
  });

  test('excludes stats flagged via isStressTestCandidate in generators', () => {
    const templateStat = DEFAULT_CONFIG.stats.hp;
    expect(templateStat).toBeDefined();

    const buildConfigWithFlag = (
      mutator: (stat: typeof templateStat) => void,
    ) => {
      const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      config.stats.testStress = {
        ...templateStat,
        id: 'testStress',
        label: 'Test Stress Stat',
      };
      mutator(config.stats.testStress);
      return config;
    };

    const assertIncluded = (config: typeof DEFAULT_CONFIG) => {
      const gen = new StatsArchetypeGenerator(config);
      const singles = gen.generateSingleStatArchetypes([25]);
      expect(singles.some((a) => a.testedStats.includes('testStress'))).toBe(true);
    };

    const baseConfig = buildConfigWithFlag(() => {
      // no-op – should be included
    });
    assertIncluded(baseConfig);

    const runGate = (mutator: (stat: typeof templateStat) => void) => {
      const config = buildConfigWithFlag(mutator);
      const gen = new StatsArchetypeGenerator(config);
      const singles = gen.generateSingleStatArchetypes([25]);
      const pairs = gen.generatePairStatArchetypes([25]);

      expect(singles.some((a) => a.testedStats.includes('testStress'))).toBe(false);
      expect(pairs.some((a) => a.testedStats.includes('testStress'))).toBe(false);
    };

    runGate((stat) => {
      stat.isHidden = true;
    });
    runGate((stat) => {
      stat.baseStat = false;
    });
    runGate((stat) => {
      stat.isPenalty = true;
    });
    runGate((stat) => {
      stat.isDetrimental = true;
    });
    runGate((stat) => {
      stat.isDerived = true;
      stat.formula = 'hp + damage';
    });
  });
});
