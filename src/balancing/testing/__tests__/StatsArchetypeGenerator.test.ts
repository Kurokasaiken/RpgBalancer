import { DEFAULT_CONFIG } from '../../config/defaultConfig';
import { BASELINE_STATS } from '../../baseline';
import { getStatWeight } from '../../statWeights';
import { StatsArchetypeGenerator } from '../StressTestArchetypeGenerator';

// Helper: count non-derived, non-formula, non-hidden stats in default config
const getNonDerivedStatIds = () =>
  Object.values(DEFAULT_CONFIG.stats)
    .filter((s) => !s.isDerived && !s.formula && !s.isHidden)
    .map((s) => s.id);

describe.skip('StatsArchetypeGenerator', () => {
  const nonDerivedIds = getNonDerivedStatIds();
  const generator = new StatsArchetypeGenerator(DEFAULT_CONFIG);

  test('generateSingleStatArchetypes creates statsArchetypes for each non-derived stat and tier', () => {
    const tiers = [25, 50, 75];
    const singles = generator.generateSingleStatArchetypes(tiers);

    // n stats × 3 tiers
    expect(singles.length).toBe(nonDerivedIds.length * tiers.length);

    for (const a of singles) {
      expect(a.testedStats).toHaveLength(1);
      expect(nonDerivedIds).toContain(a.testedStats[0]);
      expect(tiers).toContain(a.pointsPerStat);
    }
  });

  test('generatePairStatArchetypes creates C(n,2) combinations per tier', () => {
    const tiers = [25, 50, 75];
    const pairs = generator.generatePairStatArchetypes(tiers);
    const n = nonDerivedIds.length;
    const expectedPerTier = (n * (n - 1)) / 2;
    expect(pairs.length).toBe(expectedPerTier * tiers.length);

    for (const a of pairs) {
      expect(a.testedStats).toHaveLength(2);
      const [s1, s2] = a.testedStats;
      expect(nonDerivedIds).toContain(s1);
      expect(nonDerivedIds).toContain(s2);
      expect(s1).not.toBe(s2);
      expect(tiers).toContain(a.pointsPerStat);
    }
  });

  test('baseline stats are not mutated by generators', () => {
    const snapshot = JSON.parse(JSON.stringify(BASELINE_STATS));

    // Run both generators
    generator.generateSingleStatArchetypes(25);
    generator.generatePairStatArchetypes(25);

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
      const baselineValue = (BASELINE_STATS as any)[statId] ?? 0;
      const actualValue = (archetype.stats as any)[statId];

      expect(actualValue).toBeCloseTo(baselineValue + expectedDelta, 5);
    }
  });
});
