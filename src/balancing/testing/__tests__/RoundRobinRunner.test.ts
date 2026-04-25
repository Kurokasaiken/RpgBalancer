import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RoundRobinRunner } from '../RoundRobinRunner';
import type { Archetype } from '../StressTestArchetypeGenerator';
import { DEFAULT_STATS } from '../../types';

// Mock runMonteCarlo
vi.mock('../../1v1/montecarlo', () => ({
  runMonteCarlo: vi.fn(),
}));

import { runMonteCarlo } from '../../1v1/montecarlo';

const mockRunMonteCarlo = vi.mocked(runMonteCarlo);

// Create mock archetypes
const createMockArchetypes = (): Archetype[] => [
  {
    id: 'baseline',
    name: 'Baseline Archetype',
    stats: { ...DEFAULT_STATS, hp: 100, damage: 10, armor: 0 },
    seed: 42,
    type: 'single-stat',
    testedStats: [],
    pointsPerStat: 0,
    weights: {},
    description: '',
  },
  {
    id: 'single_hp',
    name: 'Health Points +25',
    stats: { ...DEFAULT_STATS, hp: 125, damage: 10, armor: 0 },
    seed: 42,
    type: 'single-stat',
    testedStats: ['hp'],
    pointsPerStat: 25,
    weights: { hp: 1 },
    description: '',
  },
  {
    id: 'single_damage',
    name: 'Damage +20',
    stats: { ...DEFAULT_STATS, hp: 100, damage: 30, armor: 0 },
    seed: 42,
    type: 'single-stat',
    testedStats: ['damage'],
    pointsPerStat: 20,
    weights: { damage: 1 },
    description: '',
  },
  {
    id: 'single_armor',
    name: 'Armor +12',
    stats: { ...DEFAULT_STATS, hp: 100, damage: 10, armor: 12 },
    seed: 42,
    type: 'single-stat',
    testedStats: ['armor'],
    pointsPerStat: 12,
    weights: { armor: 1 },
    description: '',
  },
];

describe('RoundRobinRunner', () => {
  let runner: RoundRobinRunner;
  let mockArchetypes: Archetype[];
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    runner = new RoundRobinRunner();
    mockArchetypes = createMockArchetypes();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock runMonteCarlo to return predictable results
    mockRunMonteCarlo.mockImplementation((rowStats, colStats) => {
      // Simulate HP boost winning more often
      const rowHp = rowStats.hp || 100;
      const colHp = colStats.hp || 100;
      const winRateRow = rowHp > colHp ? 0.7 : rowHp < colHp ? 0.3 : 0.5;

      return {
        wins_row: Math.round(winRateRow * 1000),
        wins_col: Math.round((1 - winRateRow) * 1000),
        draws: 0,
        win_rate_row: winRateRow,
        avg_TTK_row_win: 5,
        avg_TTK_col_win: 5,
        median_TTK: 5,
        std_TTK: 1,
        avg_hp_remaining_row_wins: 50,
        avg_hp_remaining_col_wins: 50,
        avg_overkill: 10,
        earlyImpact_row: [10, 8, 6],
        earlyImpact_col: [8, 6, 4],
        damage_time_series: {},
        totalSimulations: 1000,
        seed: 123,
        runtimeMs: 100,
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe('runRoundRobin', () => {
    it('should filter single-stat archetypes and run simulations', async () => {
      const results = await runner.runRoundRobin(mockArchetypes, 100, 25, 123);

      expect(results.matchups.length).toBe(3); // C(3,2) = 3 combinations
      expect(results.efficiencies.length).toBe(3); // 3 stats
      expect(results.tier).toBe(25);
      expect(results.iterations).toBe(100);
      expect(consoleSpy).toHaveBeenCalledWith('[RoundRobinRunner] Starting round-robin for 4 archetypes, tier 25, 100 iterations each');
    });

    it('should call runMonteCarlo for each matchup', async () => {
      await runner.runRoundRobin(mockArchetypes, 100, 25, 123);

      expect(mockRunMonteCarlo).toHaveBeenCalledTimes(3); // 3 matchups
      expect(mockRunMonteCarlo).toHaveBeenCalledWith(
        expect.objectContaining({ hp: 125 }), // single_hp
        expect.objectContaining({ hp: 100, damage: 30 }), // single_damage
        100,
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should calculate correct efficiencies', async () => {
      const results = await runner.runRoundRobin(mockArchetypes, 100, 25, 123);

      expect(results.efficiencies).toHaveLength(3);

      // HP should have highest efficiency (wins against both others)
      const hpEff = results.efficiencies.find(e => e.statId === 'hp');
      expect(hpEff).toBeDefined();
      expect(hpEff!.efficiency).toBe(0.7); // Wins both matchups
      expect(hpEff!.rank).toBe(1);
      expect(hpEff!.assessment).toBe('strong');

      // Damage should have middle efficiency
      const damageEff = results.efficiencies.find(e => e.statId === 'damage');
      expect(damageEff).toBeDefined();
      expect(damageEff!.efficiency).toBe(0.5); // 0.7 vs armor, 0.3 vs hp = 0.5 avg

      // Armor should have lowest efficiency
      const armorEff = results.efficiencies.find(e => e.statId === 'armor');
      expect(armorEff).toBeDefined();
      expect(armorEff!.efficiency).toBe(0.3);
    });

    it('should handle insufficient archetypes', async () => {
      const singleOnly = mockArchetypes.filter(a => a.id.startsWith('single_'));

      await expect(runner.runRoundRobin([singleOnly[0]], 100, 25)).rejects.toThrow(
        'Need at least 2 single-stat archetypes'
      );
    });

    it('should include runtime metadata', async () => {
      const results = await runner.runRoundRobin(mockArchetypes, 100, 25, 123);

      expect(results.timestamp).toBeDefined();
      expect(typeof results.timestamp).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should handle Monte Carlo failures gracefully', async () => {
      mockRunMonteCarlo.mockImplementationOnce(() => {
        throw new Error('Simulation failed');
      });

      const results = await runner.runRoundRobin(mockArchetypes, 100, 25, 123);

      // Should still return results, with neutral matchup for failed one
      expect(results.matchups.length).toBe(3);
      expect(results.matchups.some(m => m.winRateA === 0.5)).toBe(true);
    });
  });
});
