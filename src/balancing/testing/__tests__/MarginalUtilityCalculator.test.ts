import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { SimulationResults } from '../../simulation/types';
import { MonteCarloSimulation } from '../../simulation/MonteCarloSimulation';
import { MarginalUtilityCalculator } from '../MarginalUtilityCalculator';
import type { StatsArchetype } from '../StressTestArchetypeGenerator';
import type { MarginalUtilityMetrics } from '../metrics';

const SAMPLE_SIM_RESULTS: SimulationResults = {
  summary: {
    totalSimulations: 1000,
    winRates: {
      entity1: 0.4,
      entity2: 0.55,
      draws: 0.05,
    },
    confidenceIntervals: {
      entity1: [0.35, 0.45],
      entity2: [0.5, 0.6],
    },
  },
  combatStatistics: {
    averageTurns: 5,
    medianTurns: 5,
    minTurns: 3,
    maxTurns: 7,
    turnDistribution: { 5: 1000 },
  },
  damageMetrics: {
    entity1: {
      average: 20,
      median: 20,
      min: 15,
      max: 25,
    },
    entity2: {
      average: 30,
      median: 30,
      min: 25,
      max: 35,
    },
    averageOverkill: {
      entity1: 0,
      entity2: 0,
    },
  },
  hpEfficiency: {
    entity1: 0.3,
    entity2: 0.5,
  },
  sampleCombats: [],
};

describe('MarginalUtilityCalculator', () => {
  describe('calculateStatUtility', () => {
    let runSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      runSpy = vi.spyOn(MonteCarloSimulation, 'run');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('produces expected metrics from simulated summary', async () => {
      const calculator = new MarginalUtilityCalculator();
      const archetype: StatsArchetype = {
        id: 'stress-damage-25',
        name: 'Stress +25 Damage',
        type: 'single-stat',
        stats: { damage: 60 } as any,
        testedStats: ['damage'],
        pointsPerStat: 25,
        weights: { damage: 5 },
        description: '',
      };

      runSpy.mockReturnValue(SAMPLE_SIM_RESULTS);

      const metrics = await calculator.calculateStatUtility(archetype, 1000);

      expect(metrics.statId).toBe('damage');
      expect(metrics.type).toBe('single-stat');
      expect(metrics.winRate).toBeCloseTo(0.55);
      expect(metrics.deltaWinRate).toBeCloseTo(0.05);
      expect(metrics.dptRatio).toBeCloseTo(1.5);
      expect(metrics.hpTradeEfficiency).toBeCloseTo(0.2);
      expect(metrics.avgTurns).toBeCloseTo(5);
      expect(metrics.drawRate).toBeCloseTo(0.05);

      // Utility should lean >1.0 because winRate > baseline
      expect(metrics.utilityScore).toBeGreaterThan(1);
      expect(metrics.confidence).toBeGreaterThan(0);

      expect(runSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          iterations: 1000,
          combat: expect.objectContaining({
            entity1: expect.objectContaining({ name: 'baseline' }),
            entity2: expect.objectContaining({ name: 'statsArchetype' }),
          }),
        }),
      );
    });

    test('throws if archetype is not single-stat', async () => {
      const calculator = new MarginalUtilityCalculator();
      const pairArchetype = {
        id: 'pair',
        name: 'Pair',
        type: 'pair-stat',
        stats: {} as any,
        testedStats: ['damage', 'hp'],
        pointsPerStat: 25,
        weights: {},
        description: '',
      } satisfies StatsArchetype;

      await expect(calculator.calculateStatUtility(pairArchetype, 1000)).rejects.toThrow(
        /single-stat/i,
      );
    });
  });

  describe('calculatePairSynergy', () => {
    let runSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      runSpy = vi.spyOn(MonteCarloSimulation, 'run');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('computes synergy ratio and assessment using single metrics', async () => {
      const calculator = new MarginalUtilityCalculator();
      const pairArchetype: StatsArchetype = {
        id: 'pair-dmg-hp-25',
        name: 'Pair',
        type: 'pair-stat',
        stats: { damage: 60, hp: 180 } as any,
        testedStats: ['damage', 'hp'],
        pointsPerStat: 25,
        weights: { damage: 5, hp: 1 },
        description: '',
      };

      const singleMetrics = new Map<string, MarginalUtilityMetrics>([
        [
          'damage',
          {
            statId: 'damage',
            type: 'single-stat',
            pointsPerStat: 25,
            winRate: 0.55,
            deltaWinRate: 0.05,
            avgTurns: 5,
            dptRatio: 1.5,
            drawRate: 0.05,
            hpTradeEfficiency: 0.2,
            utilityScore: 1.1,
            confidence: 0.8,
          },
        ],
        [
          'hp',
          {
            statId: 'hp',
            type: 'single-stat',
            pointsPerStat: 25,
            winRate: 0.6,
            deltaWinRate: 0.1,
            avgTurns: 6,
            dptRatio: 1.1,
            drawRate: 0.03,
            hpTradeEfficiency: 0.3,
            utilityScore: 1.2,
            confidence: 0.85,
          },
        ],
      ]);

      // Combined win rate slightly above expectation => synergistic
      const pairResults: SimulationResults = {
        ...SAMPLE_SIM_RESULTS,
        summary: {
          ...SAMPLE_SIM_RESULTS.summary,
          winRates: {
            ...SAMPLE_SIM_RESULTS.summary.winRates,
            entity2: 0.62,
          },
        },
      };
      runSpy.mockReturnValue(pairResults);

      const synergy = await calculator.calculatePairSynergy(pairArchetype, singleMetrics, 2000);

      expect(synergy.statA).toBe('damage');
      expect(synergy.statB).toBe('hp');
      expect(synergy.pointsPerStat).toBe(25);
      expect(synergy.combinedWinRate).toBeCloseTo(0.62);
      const expectedWin = (0.55 + 0.6) / 2;
      expect(synergy.expectedWinRate).toBeCloseTo(expectedWin);
      expect(synergy.synergyRatio).toBeCloseTo(0.62 / expectedWin);
      expect(synergy.assessment).toBe('synergistic');
    });

    test('throws if single metrics for pair stats are missing', async () => {
      const calculator = new MarginalUtilityCalculator();
      const pairArchetype: StatsArchetype = {
        id: 'pair-missing',
        name: 'Pair',
        type: 'pair-stat',
        stats: {} as any,
        testedStats: ['damage', 'hp'],
        pointsPerStat: 25,
        weights: {},
        description: '',
      };

      const singleMetrics = new Map<string, MarginalUtilityMetrics>([
        [
          'damage',
          {
            statId: 'damage',
            type: 'single-stat',
            pointsPerStat: 25,
            winRate: 0.55,
            deltaWinRate: 0.05,
            avgTurns: 5,
            dptRatio: 1.5,
            drawRate: 0.05,
            hpTradeEfficiency: 0.2,
            utilityScore: 1.1,
            confidence: 0.8,
          },
        ],
      ]);

      runSpy.mockReturnValue(SAMPLE_SIM_RESULTS);

      await expect(
        calculator.calculatePairSynergy(pairArchetype, singleMetrics, 1000),
      ).rejects.toThrow(/missing single-stat metrics/i);
    });
  });
});
