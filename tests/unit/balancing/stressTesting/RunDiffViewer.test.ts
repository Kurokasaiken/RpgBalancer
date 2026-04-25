/**
 * RunDiffViewer Tests
 *
 * Tests for the MarginalUtilityRunDiffViewer tool.
 * Verifies diff calculation accuracy for stats, synergies, and configurations.
 */

import { describe, it, expect } from 'vitest';
import { MarginalUtilityRunDiffViewer, compareMarginalUtilityRuns, exportRunDiff } from '../../../src/balancing/stressTesting/RunDiffViewer';
import type { MarginalUtilityAnalysis, MarginalUtilityMetrics, SynergyAnalysis } from '../../../src/balancing/stressTesting/MarginalUtilityTypes';

describe('MarginalUtilityRunDiffViewer', () => {
  const mockStatMetrics: MarginalUtilityMetrics[] = [
    {
      statId: 'hp',
      avgWinRate: 0.55,
      stdDeviation: 0.02,
      matchupCount: 5,
      bestMatchup: { opponentStat: 'speed', winRate: 0.65 },
      worstMatchup: { opponentStat: 'damage', winRate: 0.45 },
      ranking: 2,
      confidenceInterval: { lower: 0.51, upper: 0.59 },
    },
    {
      statId: 'damage',
      avgWinRate: 0.60,
      stdDeviation: 0.03,
      matchupCount: 5,
      bestMatchup: { opponentStat: 'defense', winRate: 0.70 },
      worstMatchup: { opponentStat: 'hp', winRate: 0.50 },
      ranking: 1,
      confidenceInterval: { lower: 0.54, upper: 0.66 },
    },
  ];

  const mockSynergyAnalyses: SynergyAnalysis[] = [
    {
      pairId: 'pair_hp_damage',
      statIds: ['hp', 'damage'],
      observedWinRate: 0.68,
      expectedWinRate: 0.575,
      synergyMultiplier: 1.183,
      isOpSynergy: true,
      isWeakSynergy: false,
      isSignificant: true,
      pValue: 0.001,
      effectSize: 0.183,
    },
  ];

  const createMockAnalysis = (
    id: string,
    statMetrics: MarginalUtilityMetrics[],
    synergyAnalyses: SynergyAnalysis[],
    configOverrides: Partial<MarginalUtilityAnalysis['config']> = {}
  ): MarginalUtilityAnalysis => ({
    id,
    config: {
      simulationCount: 10000,
      seed: 12345,
      thresholds: { opThreshold: 1.15, weakThreshold: 0.95 },
      ...configOverrides,
    },
    statMetrics,
    synergyAnalyses,
    summary: {
      totalSimulations: synergyAnalyses.length * 10000,
      totalRuntimeMs: 5000,
      avgSimulationsPerSecond: 2000,
      opSynergiesCount: synergyAnalyses.filter(s => s.isOpSynergy).length,
      weakSynergiesCount: synergyAnalyses.filter(s => s.isWeakSynergy).length,
      significantSynergiesCount: synergyAnalyses.filter(s => s.isSignificant).length,
    },
    timestamp: Date.now(),
  });

  describe('compareRuns', () => {
    it('should correctly compare stat rankings and win rates', () => {
      const viewer = new MarginalUtilityRunDiffViewer();

      const baselineStats: MarginalUtilityMetrics[] = [
        { ...mockStatMetrics[0], ranking: 1, avgWinRate: 0.50 }, // hp was #1, 50% win rate
        { ...mockStatMetrics[1], ranking: 2, avgWinRate: 0.55 }, // damage was #2, 55% win rate
      ];

      const comparisonStats: MarginalUtilityMetrics[] = [
        { ...mockStatMetrics[0], ranking: 2, avgWinRate: 0.52 }, // hp now #2, 52% win rate
        { ...mockStatMetrics[1], ranking: 1, avgWinRate: 0.58 }, // damage now #1, 58% win rate
      ];

      const baselineRun = createMockAnalysis('baseline', baselineStats, []);
      const comparisonRun = createMockAnalysis('comparison', comparisonStats, []);

      const result = viewer.compareRuns(baselineRun, comparisonRun);

      expect(result.statDiffs).toHaveLength(2);

      // Check hp changes: ranking 1→2 (-1), win rate 0.50→0.52 (+4%)
      const hpDiff = result.statDiffs.find(d => d.statId === 'hp');
      expect(hpDiff).toBeDefined();
      expect(hpDiff!.rankingChange).toBe(-1);
      expect(hpDiff!.winRateChange).toBe(0.02);
      expect(hpDiff!.winRateChangePercent).toBeCloseTo(4.0, 1);

      // Check damage changes: ranking 2→1 (+1), win rate 0.55→0.58 (+5.45%)
      const damageDiff = result.statDiffs.find(d => d.statId === 'damage');
      expect(damageDiff).toBeDefined();
      expect(damageDiff!.rankingChange).toBe(1);
      expect(damageDiff!.winRateChange).toBe(0.03);
      expect(damageDiff!.winRateChangePercent).toBeCloseTo(5.45, 1);
    });

    it('should correctly compare synergy multipliers and classifications', () => {
      const viewer = new MarginalUtilityRunDiffViewer();

      const baselineSynergies: SynergyAnalysis[] = [
        {
          ...mockSynergyAnalyses[0],
          synergyMultiplier: 1.10, // Neutral synergy
          isOpSynergy: false,
          isWeakSynergy: false,
          isSignificant: true,
        },
      ];

      const comparisonSynergies: SynergyAnalysis[] = [
        {
          ...mockSynergyAnalyses[0],
          synergyMultiplier: 1.20, // Now OP synergy
          isOpSynergy: true,
          isWeakSynergy: false,
          isSignificant: true,
        },
      ];

      const baselineRun = createMockAnalysis('baseline', [], baselineSynergies);
      const comparisonRun = createMockAnalysis('comparison', [], comparisonSynergies);

      const result = viewer.compareRuns(baselineRun, comparisonSynergies);

      expect(result.synergyDiffs).toHaveLength(1);

      const synergyDiff = result.synergyDiffs[0];
      expect(synergyDiff.synergyMultiplierChange).toBe(0.10);
      expect(synergyDiff.synergyMultiplierChangePercent).toBeCloseTo(9.09, 1);
      expect(synergyDiff.significanceChange).toBe('unchanged');
      expect(synergyDiff.classificationChange).toBe('became_op');
      expect(synergyDiff.oldClassification).toBe('Neutral');
      expect(synergyDiff.newClassification).toBe('OP');
    });

    it('should detect configuration changes', () => {
      const viewer = new MarginalUtilityRunDiffViewer();

      const baselineRun = createMockAnalysis('baseline', [], [], {
        simulationCount: 10000,
        seed: 12345,
      });

      const comparisonRun = createMockAnalysis('comparison', [], [], {
        simulationCount: 15000,
        seed: 67890,
        thresholds: { opThreshold: 1.20, weakThreshold: 0.90 },
      });

      const result = viewer.compareRuns(baselineRun, comparisonRun);

      expect(result.configDiffs.simulationCountChanged).toBe(true);
      expect(result.configDiffs.seedChanged).toBe(true);
      expect(result.configDiffs.thresholdsChanged).toBe(true);
    });

    it('should generate correct summary statistics', () => {
      const viewer = new MarginalUtilityRunDiffViewer();

      const baselineStats: MarginalUtilityMetrics[] = [
        { ...mockStatMetrics[0], ranking: 1, avgWinRate: 0.50 },
      ];

      const comparisonStats: MarginalUtilityMetrics[] = [
        { ...mockStatMetrics[0], ranking: 1, avgWinRate: 0.525 }, // +5% change, significant
      ];

      const baselineSynergies: SynergyAnalysis[] = [
        { ...mockSynergyAnalyses[0], synergyMultiplier: 1.0 },
      ];

      const comparisonSynergies: SynergyAnalysis[] = [
        { ...mockSynergyAnalyses[0], synergyMultiplier: 1.15 }, // +15% change, significant
      ];

      const baselineRun = createMockAnalysis('baseline', baselineStats, baselineSynergies);
      const comparisonRun = createMockAnalysis('comparison', comparisonStats, comparisonSynergies);

      const result = viewer.compareRuns(baselineRun, comparisonRun);

      expect(result.summary.statsWithSignificantChange).toBe(1); // 5% > 5% threshold
      expect(result.summary.synergiesWithSignificantChange).toBe(1); // 15% > 10% threshold
      expect(result.summary.rankingChanges.unchanged).toBe(1); // ranking stayed the same
    });

    it('should sort diffs by significance (ranking change magnitude)', () => {
      const viewer = new MarginalUtilityRunDiffViewer();

      const baselineStats: MarginalUtilityMetrics[] = [
        { ...mockStatMetrics[0], statId: 'hp', ranking: 3 },
        { ...mockStatMetrics[1], statId: 'damage', ranking: 2 },
        { ...mockStatMetrics[0], statId: 'speed', ranking: 1 },
      ];

      const comparisonStats: MarginalUtilityMetrics[] = [
        { ...mockStatMetrics[0], statId: 'hp', ranking: 1 }, // +2 ranking change
        { ...mockStatMetrics[1], statId: 'damage', ranking: 2 }, // 0 ranking change
        { ...mockStatMetrics[0], statId: 'speed', ranking: 3 }, // -2 ranking change
      ];

      const baselineRun = createMockAnalysis('baseline', baselineStats, baselineSynergies);
      const comparisonRun = createMockAnalysis('comparison', comparisonStats, comparisonSynergies);

      const result = viewer.compareRuns(baselineRun, comparisonRun);

      expect(result.statDiffs).toHaveLength(3);
      expect(result.statDiffs[0].statId).toBe('hp'); // Largest ranking change (+2)
      expect(result.statDiffs[1].statId).toBe('speed'); // Second largest (-2)
      expect(result.statDiffs[2].statId).toBe('damage'); // No change
    });
  });

  describe('exportDiff', () => {
    it('should export to JSON format', () => {
      const viewer = new MarginalUtilityRunDiffViewer();
      const baselineRun = createMockAnalysis('baseline', mockStatMetrics, mockSynergyAnalyses);
      const comparisonRun = createMockAnalysis('comparison', mockStatMetrics, mockSynergyAnalyses);
      const analysis = viewer.compareRuns(baselineRun, comparisonRun);

      const json = viewer.exportDiff(analysis, 'json');
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('id');
      expect(parsed).toHaveProperty('comparison');
      expect(parsed).toHaveProperty('statDiffs');
      expect(parsed).toHaveProperty('synergyDiffs');
      expect(parsed).toHaveProperty('summary');
    });

    it('should export to Markdown format with proper formatting', () => {
      const viewer = new MarginalUtilityRunDiffViewer();
      const baselineRun = createMockAnalysis('baseline', mockStatMetrics, mockSynergyAnalyses);
      const comparisonRun = createMockAnalysis('comparison', mockStatMetrics, mockSynergyAnalyses);
      const analysis = viewer.compareRuns(baselineRun, comparisonRun);

      const markdown = viewer.exportDiff(analysis, 'markdown');

      expect(markdown).toContain('# Marginal Utility Run Diff Analysis');
      expect(markdown).toContain('**Analysis ID:**');
      expect(markdown).toContain('## Summary Statistics');
      expect(markdown).toContain('| Stat | Ranking Change |');
      expect(markdown).toContain('| Pair | Synergy Change |');
    });

    it('should export to CSV format', () => {
      const viewer = new MarginalUtilityRunDiffViewer();
      const baselineRun = createMockAnalysis('baseline', mockStatMetrics, mockSynergyAnalyses);
      const comparisonRun = createMockAnalysis('comparison', mockStatMetrics, mockSynergyAnalyses);
      const analysis = viewer.compareRuns(baselineRun, comparisonRun);

      const csv = viewer.exportDiff(analysis, 'csv');

      expect(csv).toContain('Section,Metric,Value');
      expect(csv).toContain('Summary,Stats with significant change');
      expect(csv).toContain('Stats,hp ranking change');
      expect(csv).toContain('Synergies,hp+damage multiplier change');
    });
  });

  describe('convenience functions', () => {
    it('compareMarginalUtilityRuns should work correctly', async () => {
      const baselineRun = createMockAnalysis('baseline', mockStatMetrics, mockSynergyAnalyses);
      const comparisonRun = createMockAnalysis('comparison', mockStatMetrics, mockSynergyAnalyses);

      const result = await compareMarginalUtilityRuns(baselineRun, comparisonRun);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('comparison');
      expect(result.comparison.baselineRun).toBe('baseline');
      expect(result.comparison.comparisonRun).toBe('comparison');
    });

    it('exportRunDiff should work correctly', () => {
      const baselineRun = createMockAnalysis('baseline', mockStatMetrics, mockSynergyAnalyses);
      const comparisonRun = createMockAnalysis('comparison', mockStatMetrics, mockSynergyAnalyses);

      const analysis = compareMarginalUtilityRuns(baselineRun, comparisonRun);
      const markdown = exportRunDiff(analysis, 'markdown');

      expect(markdown).toContain('# Marginal Utility Run Diff Analysis');
    });
  });
});
