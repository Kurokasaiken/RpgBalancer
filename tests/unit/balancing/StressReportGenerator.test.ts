import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StressReportGenerator } from '@/balancing/analytics/StressReportGenerator';
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import type { StressTestScenario } from '@/balancing/stressTesting/types';
import type { BalancerConfig } from '@/balancing/config/types';

// Mock the dependencies
vi.mock('@/balancing/stressTesting/StressTestArchetypeGenerator');
vi.mock('@/balancing/config/BalancerConfigStore');

describe('StressReportGenerator', () => {
  let generator: StressReportGenerator;
  let mockConfig: BalancerConfig;
  let mockScenario: StressTestScenario;

  beforeEach(() => {
    // Setup mock config
    mockConfig = {
      stats: {
        hp: { id: 'hp', name: 'Health Points', min: 50, max: 200, step: 5, weight: 1.0 },
        damage: { id: 'damage', name: 'Damage', min: 10, max: 50, step: 2, weight: 0.8 },
        speed: { id: 'speed', name: 'Speed', min: 5, max: 20, step: 1, weight: 0.6 },
        defense: { id: 'defense', name: 'Defense', min: 5, max: 30, step: 2, weight: 0.7 },
      },
      cards: [],
      formulas: {},
      core: { hp: 100, damage: 20, htk: 5 },
    } as BalancerConfig;

    // Setup mock scenario
    mockScenario = {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'Test scenario for unit testing',
      config: mockConfig,
      archetypes: [
        {
          id: 'baseline-1',
          name: 'Baseline Test',
          description: 'Baseline archetype',
          stats: { hp: 100, damage: 20, speed: 10, defense: 15 },
          testedStats: ['hp', 'damage'],
          pointsPerStat: 25,
          seed: 42,
          type: 'baseline',
        },
        {
          id: 'single-hp',
          name: 'HP Single',
          description: 'Single stat HP test',
          stats: { hp: 125, damage: 20, speed: 10, defense: 15 },
          testedStats: ['hp'],
          pointsPerStat: 25,
          seed: 42,
          type: 'single',
        },
        {
          id: 'pair-hp-damage',
          name: 'HP + Damage Pair',
          description: 'Pair stat test',
          stats: { hp: 125, damage: 25, speed: 10, defense: 15 },
          testedStats: ['hp', 'damage'],
          pointsPerStat: 25,
          seed: 42,
          type: 'pair',
        },
      ],
      adjustments: [],
      seed: 42,
    };

    generator = new StressReportGenerator(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with config and generate report ID', () => {
      expect(generator).toBeDefined();
      expect(generator['config']).toBe(mockConfig);
      expect(generator['reportId']).toMatch(/^stress-report-\d+-\d+$/);
    });
  });

  describe('generateReport', () => {
    it('should generate a complete stress report', async () => {
      const report = await generator.generateReport([mockScenario]);

      expect(report).toBeDefined();
      expect(report.metadata).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.archetypePerformance).toBeDefined();
      expect(report.synergyMatrix).toBeDefined();
      expect(report.kpiAnalysis).toBeDefined();

      // Validate metadata
      expect(report.metadata.reportId).toMatch(/^stress-report-\d+-\d+$/);
      expect(report.metadata.totalSimulations).toBeGreaterThan(0);
      expect(report.metadata.generatedAt).toBeDefined();
      expect(report.metadata.configVersion).toBe('1.0.0');
      expect(report.metadata.seed).toBe(42);

      // Validate summary
      expect(report.summary.totalArchetypes).toBe(3);
      expect(report.summary.singleStatArchetypes).toBe(1);
      expect(report.summary.pairStatArchetypes).toBe(1);
      expect(report.summary.averageWinRate).toBeGreaterThanOrEqual(0);
      expect(report.summary.averageWinRate).toBeLessThanOrEqual(1);
      expect(report.summary.topPerformingArchetype).toBeDefined();
      expect(report.summary.worstPerformingArchetype).toBeDefined();

      // Validate archetype performance
      expect(report.archetypePerformance).toHaveLength(3);
      report.archetypePerformance.forEach(performance => {
        expect(performance.archetypeId).toBeDefined();
        expect(performance.archetypeName).toBeDefined();
        expect(['baseline', 'single', 'pair']).toContain(performance.type);
        expect(performance.winRate).toBeGreaterThanOrEqual(0);
        expect(performance.winRate).toBeLessThanOrEqual(1);
        expect(performance.totalSimulations).toBe(1000);
        expect(performance.wins).toBeGreaterThanOrEqual(0);
        expect(performance.wins).toBeLessThanOrEqual(1000);
        expect(performance.losses).toBeGreaterThanOrEqual(0);
        expect(performance.averageTurns).toBeGreaterThanOrEqual(5);
        expect(performance.averageTurns).toBeLessThanOrEqual(15);
        expect(performance.testedStats).toBeDefined();
        expect(performance.kpiScore).toBeGreaterThanOrEqual(0);
        expect(performance.kpiScore).toBeLessThanOrEqual(100);
      });

      // Validate synergy matrix
      expect(report.synergyMatrix).toHaveLength(1); // Only one pair archetype
      const synergy = report.synergyMatrix[0];
      expect(synergy.stat1).toBe('hp');
      expect(synergy.stat2).toBe('damage');
      expect(synergy.synergyMultiplier).toBeGreaterThanOrEqual(0.8);
      expect(synergy.synergyMultiplier).toBeLessThanOrEqual(1.3);
      expect(synergy.combinedWinRate).toBeGreaterThanOrEqual(0);
      expect(synergy.combinedWinRate).toBeLessThanOrEqual(1);
      expect(synergy.expectedWinRate).toBeGreaterThanOrEqual(0);
      expect(synergy.expectedWinRate).toBeLessThanOrEqual(1);
      expect(['weak', 'normal', 'strong', 'op']).toContain(synergy.synergyLevel);

      // Validate KPI analysis
      expect(report.kpiAnalysis.highestValueStat).toBeDefined();
      expect(report.kpiAnalysis.lowestValueStat).toBeDefined();
      expect(report.kpiAnalysis.mostSynergisticPair).toHaveLength(2);
      expect(report.kpiAnalysis.leastSynergisticPair).toHaveLength(2);
      expect(report.kpiAnalysis.overallBalanceScore).toBeGreaterThanOrEqual(50);
      expect(report.kpiAnalysis.overallBalanceScore).toBeLessThanOrEqual(100);
    });

    it('should handle empty scenarios array', async () => {
      const report = await generator.generateReport([]);

      expect(report.metadata.totalSimulations).toBe(0);
      expect(report.summary.totalArchetypes).toBe(0);
      expect(report.summary.singleStatArchetypes).toBe(0);
      expect(report.summary.pairStatArchetypes).toBe(0);
      expect(report.archetypePerformance).toHaveLength(0);
      expect(report.synergyMatrix).toHaveLength(0);
    });

    it('should handle scenarios with only baseline archetypes', async () => {
      const baselineOnlyScenario = {
        ...mockScenario,
        archetypes: mockScenario.archetypes.filter(a => a.type === 'baseline'),
      };

      const report = await generator.generateReport([baselineOnlyScenario]);

      expect(report.summary.totalArchetypes).toBe(1);
      expect(report.summary.singleStatArchetypes).toBe(0);
      expect(report.summary.pairStatArchetypes).toBe(0);
      expect(report.synergyMatrix).toHaveLength(0);
    });

    it('should generate unique report IDs for multiple instances', () => {
      const generator2 = new StressReportGenerator(mockConfig);
      const generator3 = new StressReportGenerator(mockConfig);

      expect(generator['reportId']).not.toBe(generator2['reportId']);
      expect(generator2['reportId']).not.toBe(generator3['reportId']);
      expect(generator3['reportId']).not.toBe(generator['reportId']);
    });
  });

  describe('report schema validation', () => {
    it('should produce reports that match the expected schema', async () => {
      const report = await generator.generateReport([mockScenario]);

      // Test that the report has all required fields
      expect(report).toHaveProperty('metadata');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('archetypePerformance');
      expect(report).toHaveProperty('synergyMatrix');
      expect(report).toHaveProperty('kpiAnalysis');

      // Test metadata structure
      expect(report.metadata).toHaveProperty('reportId');
      expect(report.metadata).toHaveProperty('generatedAt');
      expect(report.metadata).toHaveProperty('totalSimulations');
      expect(report.metadata).toHaveProperty('configVersion');
      expect(report.metadata).toHaveProperty('seed');

      // Test summary structure
      expect(report.summary).toHaveProperty('totalArchetypes');
      expect(report.summary).toHaveProperty('singleStatArchetypes');
      expect(report.summary).toHaveProperty('pairStatArchetypes');
      expect(report.summary).toHaveProperty('averageWinRate');
      expect(report.summary).toHaveProperty('topPerformingArchetype');
      expect(report.summary).toHaveProperty('worstPerformingArchetype');

      // Test archetype performance structure
      if (report.archetypePerformance.length > 0) {
        const performance = report.archetypePerformance[0];
        expect(performance).toHaveProperty('archetypeId');
        expect(performance).toHaveProperty('archetypeName');
        expect(performance).toHaveProperty('type');
        expect(performance).toHaveProperty('winRate');
        expect(performance).toHaveProperty('totalSimulations');
        expect(performance).toHaveProperty('wins');
        expect(performance).toHaveProperty('losses');
        expect(performance).toHaveProperty('averageTurns');
        expect(performance).toHaveProperty('testedStats');
        expect(performance).toHaveProperty('kpiScore');
      }

      // Test synergy matrix structure
      if (report.synergyMatrix.length > 0) {
        const synergy = report.synergyMatrix[0];
        expect(synergy).toHaveProperty('stat1');
        expect(synergy).toHaveProperty('stat2');
        expect(synergy).toHaveProperty('synergyMultiplier');
        expect(synergy).toHaveProperty('combinedWinRate');
        expect(synergy).toHaveProperty('expectedWinRate');
        expect(synergy).toHaveProperty('synergyLevel');
      }

      // Test KPI analysis structure
      expect(report.kpiAnalysis).toHaveProperty('highestValueStat');
      expect(report.kpiAnalysis).toHaveProperty('lowestValueStat');
      expect(report.kpiAnalysis).toHaveProperty('mostSynergisticPair');
      expect(report.kpiAnalysis).toHaveProperty('leastSynergisticPair');
      expect(report.kpiAnalysis).toHaveProperty('overallBalanceScore');
    });
  });
});
