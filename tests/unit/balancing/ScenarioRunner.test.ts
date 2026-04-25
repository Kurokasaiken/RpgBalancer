import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runScenario, exportResults, convertToCSV, convertToMarkdown, listScenarios } from '../../../scripts/balancer/scenarioRunner';
import type { ScenarioConfig, ScenarioResult } from '../../../src/balancing/monteCarlo/ScenarioConfig';
import { SCENARIO_TEMPLATES } from '../../../src/balancing/monteCarlo/ScenarioConfig';

// Mock dependencies
vi.mock('../../src/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(() => true),
  };
});

describe('Scenario Runner CLI', () => {
  const mockScenario: ScenarioConfig = SCENARIO_TEMPLATES.basic1v1;
  const mockOptions = {
    scenario: 'basic-1v1',
    iterations: 1000,
    export: 'json' as const,
    verbose: false,
    seed: 12345,
    output: '/data/exports',
    list: false,
    config: 'default',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runScenario', () => {
    it('should run a scenario successfully', async () => {
      const result = await runScenario(mockScenario, mockOptions);
      
      expect(result).toBeDefined();
      expect(result.scenarioId).toBe(mockScenario.id);
      expect(result.iterations).toBe(mockOptions.iterations);
      expect(result.winRate).toBeGreaterThanOrEqual(0);
      expect(result.winRate).toBeLessThanOrEqual(1);
    });

    it('should use custom iterations from CLI options', async () => {
      const customOptions = { ...mockOptions, iterations: 5000 };
      const result = await runScenario(mockScenario, customOptions);
      
      expect(result.iterations).toBe(5000);
    });

    it('should use custom seed from CLI options', async () => {
      const customOptions = { ...mockOptions, seed: 99999 };
      const result = await runScenario(mockScenario, customOptions);
      
      // With deterministic seed, results should be consistent
      const result2 = await runScenario(mockScenario, customOptions);
      expect(result.winRate).toBe(result2.winRate);
    });

    it('should include archetype performance data', async () => {
      const result = await runScenario(mockScenario, mockOptions);
      
      expect(result.archetypePerformance).toBeDefined();
      expect(Object.keys(result.archetypePerformance)).toContain('warrior');
      expect(Object.keys(result.archetypePerformance)).toContain('mage');
      expect(Object.keys(result.archetypePerformance)).toContain('rogue');
    });

    it('should include detailed statistics', async () => {
      const result = await runScenario(mockScenario, mockOptions);
      
      expect(result.statistics).toBeDefined();
      expect(result.statistics.victories).toBeGreaterThan(0);
      expect(result.statistics.defeats).toBeGreaterThanOrEqual(0);
      expect(result.statistics.timeouts).toBeGreaterThanOrEqual(0);
      expect(result.statistics.avgDamageDealt).toBeGreaterThan(0);
      expect(result.statistics.avgDamageTaken).toBeGreaterThanOrEqual(0);
      expect(result.statistics.avgHpRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('exportResults', () => {
    it('should export results as JSON', async () => {
      const mockResult: ScenarioResult = {
        scenarioId: 'test',
        timestamp: Date.now(),
        iterations: 1000,
        winRate: 0.65,
        avgTurnsToVictory: 18.5,
        avgTurnsToDefeat: 28.2,
        turnsStdDev: 4.2,
        statistics: {
          victories: 650,
          defeats: 280,
          timeouts: 70,
          avgDamageDealt: 125.5,
          avgDamageTaken: 89.3,
          avgHpRemaining: 45.2,
        },
        archetypePerformance: {},
        synergyAnalysis: [],
      };

      await exportResults(mockResult, { ...mockOptions, export: 'json' });
      
      const { writeFileSync } = await import('fs');
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.json'),
        expect.stringContaining('"scenarioId":"test"'),
        'utf8'
      );
    });

    it('should export results as CSV', async () => {
      const mockResult: ScenarioResult = {
        scenarioId: 'test',
        timestamp: Date.now(),
        iterations: 1000,
        winRate: 0.65,
        avgTurnsToVictory: 18.5,
        avgTurnsToDefeat: 28.2,
        turnsStdDev: 4.2,
        statistics: {
          victories: 650,
          defeats: 280,
          timeouts: 70,
          avgDamageDealt: 125.5,
          avgDamageTaken: 89.3,
          avgHpRemaining: 45.2,
        },
        archetypePerformance: {
          warrior: {
            archetypeId: 'warrior',
            winRate: 0.7,
            avgTurns: 17.2,
            stdDev: 3.8,
            rating: 'Good',
          },
        },
        synergyAnalysis: [],
      };

      await exportResults(mockResult, { ...mockOptions, export: 'csv' });
      
      const { writeFileSync } = await import('fs');
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.csv'),
        expect.stringContaining('Scenario ID,Timestamp,Iterations,Win Rate'),
        'utf8'
      );
    });

    it('should export results as Markdown', async () => {
      const mockResult: ScenarioResult = {
        scenarioId: 'test',
        timestamp: Date.now(),
        iterations: 1000,
        winRate: 0.65,
        avgTurnsToVictory: 18.5,
        avgTurnsToDefeat: 28.2,
        turnsStdDev: 4.2,
        statistics: {
          victories: 650,
          defeats: 280,
          timeouts: 70,
          avgDamageDealt: 125.5,
          avgDamageTaken: 89.3,
          avgHpRemaining: 45.2,
        },
        archetypePerformance: {},
        synergyAnalysis: [],
      };

      await exportResults(mockResult, { ...mockOptions, export: 'markdown' });
      
      const { writeFileSync } = await import('fs');
      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.md'),
        expect.stringContaining('# Scenario Results: test'),
        'utf8'
      );
    });
  });

  describe('convertToCSV', () => {
    it('should convert scenario results to CSV format', () => {
      const mockResult: ScenarioResult = {
        scenarioId: 'test',
        timestamp: Date.now(),
        iterations: 1000,
        winRate: 0.65,
        avgTurnsToVictory: 18.5,
        avgTurnsToDefeat: 28.2,
        turnsStdDev: 4.2,
        statistics: {
          victories: 650,
          defeats: 280,
          timeouts: 70,
          avgDamageDealt: 125.5,
          avgDamageTaken: 89.3,
          avgHpRemaining: 45.2,
        },
        archetypePerformance: {
          warrior: {
            archetypeId: 'warrior',
            winRate: 0.7,
            avgTurns: 17.2,
            stdDev: 3.8,
            rating: 'Good',
          },
        },
        synergyAnalysis: [],
      };

      const csv = convertToCSV(mockResult);
      
      expect(csv).toContain('Scenario ID,Timestamp,Iterations,Win Rate');
      expect(csv).toContain('test');
      expect(csv).toContain('0.6500');
      expect(csv).toContain('18.50');
      expect(csv).toContain('warrior');
      expect(csv).toContain('0.7000');
    });
  });

  describe('convertToMarkdown', () => {
    it('should convert scenario results to Markdown format', () => {
      const mockResult: ScenarioResult = {
        scenarioId: 'test',
        timestamp: Date.now(),
        iterations: 1000,
        winRate: 0.65,
        avgTurnsToVictory: 18.5,
        avgTurnsToDefeat: 28.2,
        turnsStdDev: 4.2,
        statistics: {
          victories: 650,
          defeats: 280,
          timeouts: 70,
          avgDamageDealt: 125.5,
          avgDamageTaken: 89.3,
          avgHpRemaining: 45.2,
        },
        archetypePerformance: {
          warrior: {
            archetypeId: 'warrior',
            winRate: 0.7,
            avgTurns: 17.2,
            stdDev: 3.8,
            rating: 'Good',
          },
        },
        synergyAnalysis: [],
      };

      const markdown = convertToMarkdown(mockResult);
      
      expect(markdown).toContain('# Scenario Results: test');
      expect(markdown).toContain('**Win Rate:** 65.00%');
      expect(markdown).toContain('**Avg Turns to Victory:** 18.50');
      expect(markdown).toContain('- **Victories:** 650');
      expect(markdown).toContain('| Archetype | Win Rate | Avg Turns | Rating |');
      expect(markdown).toContain('| warrior | 70.00% | 17.20 | Good |');
    });

    it('should include synergy analysis when present', () => {
      const mockResult: ScenarioResult = {
        scenarioId: 'test',
        timestamp: Date.now(),
        iterations: 1000,
        winRate: 0.65,
        avgTurnsToVictory: 18.5,
        avgTurnsToDefeat: 28.2,
        turnsStdDev: 4.2,
        statistics: {
          victories: 650,
          defeats: 280,
          timeouts: 70,
          avgDamageDealt: 125.5,
          avgDamageTaken: 89.3,
          avgHpRemaining: 45.2,
        },
        archetypePerformance: {},
        synergyAnalysis: [
          {
            archetypePair: ['warrior', 'mage'],
            combinedWinRate: 0.75,
            expectedWinRate: 0.65,
            synergyMultiplier: 1.15,
            rating: 'Good',
            sampleSize: 500,
          },
        ],
      };

      const markdown = convertToMarkdown(mockResult);
      
      expect(markdown).toContain('## Synergy Analysis');
      expect(markdown).toContain('| Pair | Combined Win Rate | Expected | Multiplier | Rating | Sample Size |');
      expect(markdown).toContain('| warrior + mage | 75.00% | 65.00% | 1.15 | Good | 500 |');
    });
  });

  describe('listScenarios', () => {
    it('should list all available scenarios', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      listScenarios();
      
      expect(consoleSpy).toHaveBeenCalledWith('📋 Available Scenarios:');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('basic-1v1'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('boss-fight'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('group-combat'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('swarm-horde'));
      
      consoleSpy.mockRestore();
    });
  });
});
