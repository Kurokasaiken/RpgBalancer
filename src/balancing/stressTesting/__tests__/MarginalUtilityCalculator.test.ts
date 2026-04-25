import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarginalUtilityCalculator, type MarginalUtilityResult, type SynergyResult } from '../MarginalUtilityCalculator';
import { runMonteCarlo } from '@/balancing/1v1/montecarlo';
import type { Archetype } from '../StressTestArchetypeGenerator';

// Mock runMonteCarlo to avoid slow simulations in tests
vi.mock('@/balancing/1v1/montecarlo', () => ({
  runMonteCarlo: vi.fn(),
}));

// Mock BALANCING_CONFIG for threshold tests
vi.mock('@/balancing/balancingConfig', () => ({
  BALANCING_CONFIG: {
    OP_SYNERGY_THRESHOLD: 1.15,
    WEAK_SYNERGY_THRESHOLD: 0.95,
  },
}));

describe('MarginalUtilityCalculator', () => {
  let calculator: MarginalUtilityCalculator;
  let mockBaseline: Archetype;
  let mockSingleArchetypes: Archetype[];
  let mockPairArchetypes: Archetype[];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock baseline archetype
    mockBaseline = {
      id: 'baseline',
      name: 'Baseline Archetype',
      seed: 42,
      stats: { hp: 100, damage: 10, armor: 0 },
    };

    // Create mock single stat archetypes
    mockSingleArchetypes = [
      {
        id: 'single_hp',
        name: 'HP Boost',
        seed: 43,
        stats: { hp: 125, damage: 10, armor: 0 }, // +25% hp
      },
      {
        id: 'single_damage',
        name: 'Damage Boost',
        seed: 44,
        stats: { hp: 100, damage: 12.5, armor: 0 }, // +25% damage
      },
    ];

    // Create mock pair archetype
    mockPairArchetypes = [
      {
        id: 'pair_hp_damage',
        name: 'HP and Damage Boost',
        seed: 45,
        stats: { hp: 125, damage: 12.5, armor: 0 },
      },
    ];

    calculator = new MarginalUtilityCalculator(mockBaseline);
  });

  describe('analyzeArchetypes', () => {
    it('should calculate marginal utilities for archetypes', () => {
      // Mock runMonteCarlo to return deterministic win distributions.
      // We rely on column (archetype under test) win rate, so each call sets wins_col explicitly.
      const mockRunMonteCarlo = vi.mocked(runMonteCarlo);
      mockRunMonteCarlo
        // Baseline mirror match → perfectly symmetrical (0.5 win rate)
        .mockImplementationOnce(() => ({
          wins_row: 5000,
          wins_col: 5000,
          draws: 0,
          win_rate_row: 0.5,
          avg_TTK_row_win: 10,
          avg_TTK_col_win: 10,
          median_TTK: 9,
          std_TTK: 2,
          avg_hp_remaining_row_wins: 10,
          avg_hp_remaining_col_wins: 10,
          avg_overkill: 5,
          earlyImpact_row: [10, 10, 10],
          earlyImpact_col: [10, 10, 10],
          damage_time_series: {
            turn1: { mean: 9, median: 9 },
          },
          totalSimulations: 10000,
          seed: 42,
          runtimeMs: 100,
        }))
        // Single HP archetype beats baseline 60% of the time (wins_col drive pairScore)
        .mockImplementationOnce(() => ({
          wins_row: 4000,
          wins_col: 6000,
          draws: 0,
          win_rate_row: 0.4,
          avg_TTK_row_win: 10,
          avg_TTK_col_win: 8,
          median_TTK: 8,
          std_TTK: 2,
          avg_hp_remaining_row_wins: 10,
          avg_hp_remaining_col_wins: 8,
          avg_overkill: 5,
          earlyImpact_row: [10, 10, 10],
          earlyImpact_col: [8, 8, 8],
          damage_time_series: {
            turn1: { mean: 8, median: 8 },
          },
          totalSimulations: 10000,
          seed: 43,
          runtimeMs: 100,
        }))
        // Single damage archetype beats baseline 65% of the time
        .mockImplementationOnce(() => ({
          wins_row: 3500,
          wins_col: 6500,
          draws: 0,
          win_rate_row: 0.35,
          avg_TTK_row_win: 10,
          avg_TTK_col_win: 7,
          median_TTK: 7,
          std_TTK: 2,
          avg_hp_remaining_row_wins: 10,
          avg_hp_remaining_col_wins: 7,
          avg_overkill: 5,
          earlyImpact_row: [10, 10, 10],
          earlyImpact_col: [7, 7, 7],
          damage_time_series: {
            turn1: { mean: 7, median: 7 },
          },
          totalSimulations: 10000,
          seed: 44,
          runtimeMs: 100,
        }));

      const allArchetypes = [mockBaseline, ...mockSingleArchetypes];
      const results = calculator.analyzeArchetypes(allArchetypes);

      expect(results).toHaveLength(3);
      expect(mockRunMonteCarlo).toHaveBeenCalledTimes(3); // once for each archetype

      // Check baseline result
      const baselineResult = results.find(r => r.archetype.id === 'baseline');
      expect(baselineResult).toBeDefined();
      expect(baselineResult!.averageScore).toBe(0.5);
      expect(baselineResult!.marginalUtility).toBe(0); // baseline is reference

      // Check single stat results
      const hpResult = results.find(r => r.archetype.id === 'single_hp');
      expect(hpResult).toBeDefined();
      expect(hpResult!.averageScore).toBe(0.6);
      expect(hpResult!.marginalUtility).toBeCloseTo(20, 5); // (0.6 / 0.5 - 1) * 100 = 20%

      const damageResult = results.find(r => r.archetype.id === 'single_damage');
      expect(damageResult).toBeDefined();
      expect(damageResult!.averageScore).toBe(0.65);
      expect(damageResult!.marginalUtility).toBeCloseTo(30, 5); // (0.65 / 0.5 - 1) * 100 = 30%
    });

    it('should throw error if baseline archetype not found', () => {
      const mockRunMonteCarlo = vi.mocked(runMonteCarlo);
      mockRunMonteCarlo.mockImplementation(() => ({
        wins_row: 5000,
        wins_col: 5000,
        draws: 0,
        win_rate_row: 0.5,
        avg_TTK_row_win: 10,
        avg_TTK_col_win: 10,
        median_TTK: 9,
        std_TTK: 2,
        avg_hp_remaining_row_wins: 10,
        avg_hp_remaining_col_wins: 10,
        avg_overkill: 5,
        earlyImpact_row: [10, 10, 10],
        earlyImpact_col: [10, 10, 10],
        damage_time_series: {
          turn1: { mean: 9, median: 9 },
        },
        totalSimulations: 10000,
        seed: 42,
        runtimeMs: 100,
      }));

      const archetypesWithoutBaseline = mockSingleArchetypes;

      expect(() => calculator.analyzeArchetypes(archetypesWithoutBaseline))
        .toThrow('Baseline archetype not found');
    });
  });

  describe('analyzeSynergies', () => {
    it('should calculate synergies for pair archetypes', () => {
      const mockRunMonteCarlo = vi.mocked(runMonteCarlo);
      mockRunMonteCarlo.mockImplementation(() => ({
        wins_row: 5000,
        wins_col: 7000, // pair wins
        draws: 0,
        win_rate_row: 0.5,
        avg_TTK_row_win: 10,
        avg_TTK_col_win: 6,
        median_TTK: 8,
        std_TTK: 2,
        avg_hp_remaining_row_wins: 10,
        avg_hp_remaining_col_wins: 6,
        avg_overkill: 5,
        earlyImpact_row: [10, 10, 10],
        earlyImpact_col: [6, 6, 6],
        damage_time_series: {
          turn1: { mean: 8, median: 8 },
        },
        totalSimulations: 10000,
        seed: 45,
        runtimeMs: 100,
      }));

      const singleResults: MarginalUtilityResult[] = [
        {
          archetype: mockSingleArchetypes[0], // hp
          averageScore: 0.6,
          marginalUtility: 20,
          standardDeviation: 0,
          simulationCount: 10000,
        },
        {
          archetype: mockSingleArchetypes[1], // damage
          averageScore: 0.65,
          marginalUtility: 30,
          standardDeviation: 0,
          simulationCount: 10000,
        },
      ];

      const synergies = calculator.analyzeSynergies(mockPairArchetypes, singleResults);

      expect(synergies).toHaveLength(1);
      const synergy = synergies[0];
      expect(synergy.statIds).toEqual(['hp', 'damage']);
      expect(synergy.pairScore).toBe(0.7);
      expect(synergy.expectedScore).toBe((0.6 + 0.65) / 2); // 0.625
      expect(synergy.synergyMultiplier).toBe(0.7 / 0.625); // 1.12
    });

    it('should identify OP synergies above threshold', () => {
      const mockRunMonteCarlo = vi.mocked(runMonteCarlo);
      mockRunMonteCarlo.mockImplementation(() => ({
        wins_row: 5000,
        wins_col: 8000, // high synergy
        draws: 0,
        win_rate_row: 0.5,
        avg_TTK_row_win: 10,
        avg_TTK_col_win: 4,
        median_TTK: 7,
        std_TTK: 2,
        avg_hp_remaining_row_wins: 10,
        avg_hp_remaining_col_wins: 4,
        avg_overkill: 5,
        earlyImpact_row: [10, 10, 10],
        earlyImpact_col: [4, 4, 4],
        damage_time_series: {
          turn1: { mean: 7, median: 7 },
        },
        totalSimulations: 10000,
        seed: 45,
        runtimeMs: 100,
      }));

      const singleResults: MarginalUtilityResult[] = [
        {
          archetype: mockSingleArchetypes[0],
          averageScore: 0.55,
          marginalUtility: 10,
          standardDeviation: 0,
          simulationCount: 10000,
        },
        {
          archetype: mockSingleArchetypes[1],
          averageScore: 0.55,
          marginalUtility: 10,
          standardDeviation: 0,
          simulationCount: 10000,
        },
      ];

      const synergies = calculator.analyzeSynergies(mockPairArchetypes, singleResults);

      const synergy = synergies[0];
      expect(synergy.synergyMultiplier).toBeGreaterThan(1.15); // 0.8 / 0.55 ≈ 1.45
      expect(synergy.isOpSynergy).toBe(true);
      expect(synergy.isWeakSynergy).toBe(false);
    });

    it('should identify weak synergies below threshold', () => {
      const mockRunMonteCarlo = vi.mocked(runMonteCarlo);
      mockRunMonteCarlo.mockImplementation(() => ({
        wins_row: 5000,
        wins_col: 4500, // low synergy
        draws: 1000,
        win_rate_row: 0.5,
        avg_TTK_row_win: 10,
        avg_TTK_col_win: 12,
        median_TTK: 11,
        std_TTK: 2,
        avg_hp_remaining_row_wins: 10,
        avg_hp_remaining_col_wins: 12,
        avg_overkill: 5,
        earlyImpact_row: [10, 10, 10],
        earlyImpact_col: [12, 12, 12],
        damage_time_series: {
          turn1: { mean: 11, median: 11 },
        },
        totalSimulations: 10000,
        seed: 45,
        runtimeMs: 100,
      }));

      const singleResults: MarginalUtilityResult[] = [
        {
          archetype: mockSingleArchetypes[0],
          averageScore: 0.55,
          marginalUtility: 10,
          standardDeviation: 0,
          simulationCount: 10000,
        },
        {
          archetype: mockSingleArchetypes[1],
          averageScore: 0.55,
          marginalUtility: 10,
          standardDeviation: 0,
          simulationCount: 10000,
        },
      ];

      const synergies = calculator.analyzeSynergies(mockPairArchetypes, singleResults);

      const synergy = synergies[0];
      expect(synergy.synergyMultiplier).toBeLessThan(0.95); // 0.45 / 0.55 ≈ 0.818
      expect(synergy.isOpSynergy).toBe(false);
      expect(synergy.isWeakSynergy).toBe(true);
    });

    it('should throw error for invalid pair archetype ID', () => {
      const invalidPair = {
        id: 'invalid_pair',
        name: 'Invalid Pair',
        seed: 46,
        stats: { hp: 125, damage: 12.5, armor: 0 },
      } as Archetype;

      const singleResults: MarginalUtilityResult[] = [];

      expect(() => calculator.analyzeSynergies([invalidPair], singleResults))
        .toThrow('Invalid pair archetype ID: invalid_pair');
    });

    it('should throw error if single stat results missing', () => {
      const singleResults: MarginalUtilityResult[] = [
        {
          archetype: mockSingleArchetypes[0], // only hp
          averageScore: 0.6,
          marginalUtility: 20,
          standardDeviation: 0,
          simulationCount: 10000,
        },
        // missing damage
      ];

      expect(() => calculator.analyzeSynergies(mockPairArchetypes, singleResults))
        .toThrow('Missing single stat results for hp or damage');
    });
  });

  describe('generateSynergyHeatmapData', () => {
    it('should generate symmetric heatmap data', () => {
      const synergies: SynergyResult[] = [
        {
          pairArchetype: mockPairArchetypes[0],
          statIds: ['hp', 'damage'],
          pairScore: 0.7,
          expectedScore: 0.625,
          synergyMultiplier: 1.12,
          isOpSynergy: false,
          isWeakSynergy: false,
        },
      ];

      const heatmap = calculator.generateSynergyHeatmapData(synergies);

      expect(heatmap.hp).toBeDefined();
      expect(heatmap.damage).toBeDefined();
      expect(heatmap.hp.damage).toBe(1.12);
      expect(heatmap.damage.hp).toBe(1.12); // symmetric
    });
  });

  describe('exportMarginalUtilitiesToCsv', () => {
    it('should export marginal utilities to CSV format', () => {
      const marginalUtilities: MarginalUtilityResult[] = [
        {
          archetype: mockBaseline,
          averageScore: 0.5,
          marginalUtility: 0,
          standardDeviation: 0,
          simulationCount: 10000,
        },
        {
          archetype: mockSingleArchetypes[0],
          averageScore: 0.6,
          marginalUtility: 20,
          standardDeviation: 0.05,
          simulationCount: 10000,
        },
      ];

      const csv = calculator.exportMarginalUtilitiesToCsv(marginalUtilities);

      const lines = csv.split('\n');
      expect(lines[0]).toBe('Archetype ID,Average Score,Marginal Utility (%),Standard Deviation,Simulation Count');
      expect(lines[1]).toBe('baseline,0.5000,0.00,0.0000,10000');
      expect(lines[2]).toBe('single_hp,0.6000,20.00,0.0500,10000');
    });
  });

  describe('exportSynergiesToCsv', () => {
    it('should export synergies to CSV format', () => {
      const synergies: SynergyResult[] = [
        {
          pairArchetype: mockPairArchetypes[0],
          statIds: ['hp', 'damage'],
          pairScore: 0.7,
          expectedScore: 0.625,
          synergyMultiplier: 1.12,
          isOpSynergy: false,
          isWeakSynergy: false,
        },
      ];

      const csv = calculator.exportSynergiesToCsv(synergies);

      const lines = csv.split('\n');
      expect(lines[0]).toBe('Stat 1,Stat 2,Pair Score,Expected Score,Synergy Multiplier,Is OP,Is Weak');
      expect(lines[1]).toBe('hp,damage,0.7000,0.6250,1.1200,false,false');
    });
  });

  describe('toJson', () => {
    it('should export analysis results to JSON', () => {
      const analysis = {
        marginalUtilities: [
          {
            archetype: mockBaseline,
            averageScore: 0.5,
            marginalUtility: 0,
            standardDeviation: 0,
            simulationCount: 10000,
          },
        ],
        synergies: [
          {
            pairArchetype: mockPairArchetypes[0],
            statIds: ['hp', 'damage'] as [string, string],
            pairScore: 0.7,
            expectedScore: 0.625,
            synergyMultiplier: 1.12,
            isOpSynergy: false,
            isWeakSynergy: false,
          },
        ],
      };

      const json = calculator.toJson(analysis);
      const parsed = JSON.parse(json);

      expect(parsed.marginalUtilities).toHaveLength(1);
      expect(parsed.synergies).toHaveLength(1);
      expect(parsed.marginalUtilities[0].archetype.id).toBe('baseline');
      expect(parsed.synergies[0].statIds).toEqual(['hp', 'damage']);
    });
  });

  describe('deterministic seeding', () => {
    it('should use deterministic seeding for reproducibility', () => {
      const mockRunMonteCarlo = vi.mocked(runMonteCarlo);

      // Run analysis twice
      calculator.analyzeArchetypes([mockBaseline, mockSingleArchetypes[0]]);
      calculator.analyzeArchetypes([mockBaseline, mockSingleArchetypes[0]]);

      // Should call runMonteCarlo with same seeds for same archetypes
      const calls = mockRunMonteCarlo.mock.calls;
      expect(calls[0][3]).toBe(42); // baseline seed
      expect(calls[1][3]).toBe(43); // single_hp seed
      expect(calls[2][3]).toBe(42); // baseline seed again
      expect(calls[3][3]).toBe(43); // single_hp seed again
    });
  });

  describe('performance and simulation count', () => {
    it('should run specified number of simulations', () => {
      const customCalculator = new MarginalUtilityCalculator(mockBaseline, undefined, 5000);
      const mockRunMonteCarlo = vi.mocked(runMonteCarlo);

      customCalculator.analyzeArchetypes([mockBaseline]);

      const callArgs = mockRunMonteCarlo.mock.calls[0];
      expect(callArgs[2]).toBe(5000); // simulationCount
    });
  });
});
