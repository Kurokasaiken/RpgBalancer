import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import { buildDefaultStatVector, runStatStressTest, type StatMetrics } from '../stats/StatStressHarness';

function createMetricsFromStats(stats: Record<string, number>): StatMetrics {
  return { ...stats };
}

describe('StatStressHarness', () => {
  it('buildDefaultStatVector uses config default values for core stats', () => {
    const vector = buildDefaultStatVector(DEFAULT_CONFIG);

    expect(vector.hp).toBe(DEFAULT_CONFIG.stats.hp.defaultValue);
    expect(vector.damage).toBe(DEFAULT_CONFIG.stats.damage.defaultValue);
    expect(vector.txc).toBe(DEFAULT_CONFIG.stats.txc.defaultValue);
    expect(vector.evasion).toBe(DEFAULT_CONFIG.stats.evasion.defaultValue);
    expect(vector.critChance).toBe(DEFAULT_CONFIG.stats.critChance.defaultValue);
  });

  it('runStatStressTest applies a positive delta for damage and reports matching metrics', async () => {
    const baseStats = buildDefaultStatVector(DEFAULT_CONFIG);
    const budgetPerStat = 50; // HP-equivalent points per stat

    const evaluator = (stats: Record<string, number>): StatMetrics =>
      createMetricsFromStats(stats);

    const report = await runStatStressTest(DEFAULT_CONFIG, baseStats, budgetPerStat, evaluator);

    const damageResult = report.single.find((r) => r.statId === 'damage');
    expect(damageResult).toBeDefined();
    if (!damageResult) return;

    // Delta should be positive when budgetPerStat and weight are positive
    expect(damageResult.delta).toBeGreaterThan(0);

    const baseDamage = baseStats.damage;
    const variantDamage = damageResult.variant.damage;

    expect(variantDamage).toBeCloseTo(baseDamage + damageResult.delta, 6);
  });

  it('runStatStressTest excludes penalty stats from driverStatIds and results', async () => {
    const baseStats = buildDefaultStatVector(DEFAULT_CONFIG);
    const budgetPerStat = 50;

    const evaluator = (stats: Record<string, number>): StatMetrics =>
      createMetricsFromStats(stats);

    const report = await runStatStressTest(DEFAULT_CONFIG, baseStats, budgetPerStat, evaluator);

    // Known penalty stats in defaultConfig
    const penaltyIds = Object.values(DEFAULT_CONFIG.stats)
      .filter((s) => s.isPenalty)
      .map((s) => s.id);
    const derivedIds = Object.values(DEFAULT_CONFIG.stats)
      .filter((s) => s.isDerived)
      .map((s) => s.id);
    const excludedIds = [...penaltyIds, ...derivedIds];

    excludedIds.forEach((id) => {
      expect(report.driverStatIds).not.toContain(id);
    });

    report.single.forEach((r) => {
      expect(excludedIds).not.toContain(r.statId);
    });

    report.pairs.forEach((r) => {
      expect(excludedIds).not.toContain(r.statIdA);
      expect(excludedIds).not.toContain(r.statIdB);
    });
  });

  it('runStatStressTest returns no variants when budgetPerStat is non-positive', async () => {
    const baseStats = buildDefaultStatVector(DEFAULT_CONFIG);
    const budgetPerStat = 0;

    const evaluator = (stats: Record<string, number>): StatMetrics =>
      createMetricsFromStats(stats);

    const report = await runStatStressTest(DEFAULT_CONFIG, baseStats, budgetPerStat, evaluator);

    expect(report.single.length).toBe(0);
    expect(report.pairs.length).toBe(0);
  });
});
