import { describe, expect, it } from 'vitest';
import type { MarginalUtilityAnalysis } from '@/balancing/stressTesting/MarginalUtilityTypes';
import {
  formatReportAsMarkdown,
  generateSynergyReport,
  type SynergyReportOptions,
} from '../marginalReport';

const MOCK_ANALYSIS: MarginalUtilityAnalysis = {
  id: 'mu-analysis-test',
  config: {
    simulationCount: 1000,
    seed: 12345,
    thresholds: {
      opThreshold: 1.15,
      weakThreshold: 0.95,
    },
  },
  statMetrics: [],
  synergyAnalyses: [
    {
      pairId: 'pair_hp_damage',
      statIds: ['hp', 'damage'],
      observedWinRate: 0.64,
      expectedWinRate: 0.55,
      synergyMultiplier: 1.16,
      isOpSynergy: true,
      isWeakSynergy: false,
      isSignificant: true,
      pValue: 0.02,
      effectSize: 0.18,
    },
    {
      pairId: 'pair_speed_armor',
      statIds: ['speed', 'armor'],
      observedWinRate: 0.41,
      expectedWinRate: 0.53,
      synergyMultiplier: 0.77,
      isOpSynergy: false,
      isWeakSynergy: true,
      isSignificant: false,
      pValue: 0.11,
      effectSize: 0.12,
    },
    {
      pairId: 'pair_hp_speed',
      statIds: ['hp', 'speed'],
      observedWinRate: 0.9,
      expectedWinRate: 0.55,
      synergyMultiplier: 1.64,
      isOpSynergy: true,
      isWeakSynergy: false,
      isSignificant: true,
      pValue: 0.001,
      effectSize: 0.35,
    },
  ],
  summary: {
    totalSimulations: 3000,
    totalRuntimeMs: 1500,
    avgSimulationsPerSecond: 2000,
    opSynergiesCount: 2,
    weakSynergiesCount: 1,
    significantSynergiesCount: 2,
  },
  timestamp: Date.now(),
};

const REPORT_OPTIONS: SynergyReportOptions = {
  opThreshold: 1.15,
  weakThreshold: 0.9,
  anomalyThreshold: 1.4,
  weakAnomalyThreshold: 0.8,
  highlightLimit: 5,
};

describe('marginalReport.generateSynergyReport', () => {
  it('calculates summary statistics and highlights', () => {
    const report = generateSynergyReport(MOCK_ANALYSIS, REPORT_OPTIONS, '/tmp/mock.json');

    expect(report.summary.totalPairs).toBe(3);
    expect(report.summary.opSynergies).toBe(2);
    expect(report.highlights.top).toHaveLength(2);
    expect(report.highlights.weak).toHaveLength(1);
    expect(report.highlights.anomalies).toHaveLength(1);
    expect(report.metadata.inputFile).toContain('/tmp/mock.json');
  });
});

describe('marginalReport.formatReportAsMarkdown', () => {
  it('renders markdown with tables and summary values', () => {
    const report = generateSynergyReport(MOCK_ANALYSIS, REPORT_OPTIONS, '/tmp/mock.json');
    const markdown = formatReportAsMarkdown(report);

    expect(markdown).toContain('# Marginal Utility Synergy Report');
    expect(markdown).toContain('## Summary');
    expect(markdown).toContain('| Pair | Multiplier |');
    expect(markdown).toContain('hp + speed');
    expect(markdown).toContain('Config → OP ≥ 1.15×');
  });
});
