/**
 * Stress Testing CLI Orchestrator Unit Tests
 * 
 * Mock-based tests for the CLI pipeline orchestrator.
 * Tests configuration loading, archetype generation, analysis execution,
 * export functionality, and error handling.
 * 
 * @module runStressPipeline.test
 * @since 2026-01-11
 * @author Atlas-CLI
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runStressPipeline } from '../runStressPipeline';
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import { MarginalUtilityCalculator } from '@/balancing/stressTesting/MarginalUtilityCalculator';
import { saveData } from '@/shared/persistence/PersistenceService';
import { exportStressTestTelemetry, getStressTestTelemetrySummary } from '@/analytics/telemetry/telemetryProvider';
import type { BalancerConfig } from '@/balancing/config/types';
import type { StressTestArchetype } from '@/balancing/stressTesting/types';
import type { MarginalUtilityAnalysis } from '@/balancing/stressTesting/MarginalUtilityTypes';

// Mock all dependencies
vi.mock('@/balancing/config/BalancerConfigStore');
vi.mock('@/balancing/stressTesting/StressTestArchetypeGenerator');
vi.mock('@/balancing/stressTesting/MarginalUtilityCalculator');
vi.mock('@/shared/persistence/PersistenceService');
vi.mock('@/analytics/telemetry/telemetryProvider');

// Mock console methods
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Mock process methods
const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
} as any);

describe('runStressPipeline CLI', () => {
  const mockConfig: BalancerConfig = {
    stats: {
      hp: { id: 'hp', name: 'Health', weight: 1.0, defaultValue: 100 },
      damage: { id: 'damage', name: 'Damage', weight: 1.0, defaultValue: 10 },
      speed: { id: 'speed', name: 'Speed', weight: 0.8, defaultValue: 5 },
    },
    archetypes: {},
    items: {},
    enemies: {},
    skills: {},
    formulas: {},
  };

  const mockArchetypes: StressTestArchetype[] = [
    {
      id: 'baseline',
      name: 'Baseline',
      description: 'Baseline archetype',
      type: 'baseline',
      testedStats: [],
      stats: { hp: 100, damage: 10, speed: 5 },
    },
    {
      id: 'single_hp',
      name: 'HP Single',
      description: 'Single HP stat',
      type: 'single',
      testedStats: ['hp'],
      stats: { hp: 125, damage: 10, speed: 5 },
    },
    {
      id: 'pair_hp_damage',
      name: 'HP+Damage Pair',
      description: 'HP and Damage pair',
      type: 'pair',
      testedStats: ['hp', 'damage'],
      stats: { hp: 125, damage: 35, speed: 5 },
    },
  ];

  const mockAnalysis: MarginalUtilityAnalysis = {
    id: 'mu-analysis-12345-2026-01-11',
    config: {
      simulationCount: 10000,
      seed: 12345,
      thresholds: {
        opThreshold: 1.15,
        weakThreshold: 0.95,
      },
    },
    statMetrics: [
      {
        statId: 'hp',
        avgWinRate: 0.65,
        stdDeviation: 0.12,
        bestMatchup: { opponentStat: 'speed', winRate: 0.75 },
        worstMatchup: { opponentStat: 'damage', winRate: 0.55 },
        marginalUtility: 0.15,
      },
    ],
    synergyAnalyses: [
      {
        pairId: 'pair_hp_damage',
        statIds: ['hp', 'damage'],
        observedWinRate: 0.72,
        expectedWinRate: 0.65,
        synergyMultiplier: 1.11,
        isOpSynergy: false,
        isWeakSynergy: false,
        isSignificant: true,
        pValue: 0.03,
        effectSize: 0.11,
      },
    ],
    summary: {
      totalSimulations: 910000,
      totalRuntimeMs: 284500,
      avgSimulationsPerSecond: 3197,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    vi.mocked(BalancerConfigStore.load).mockResolvedValue(mockConfig);
    vi.mocked(BalancerConfigStore.loadFromFile).mockResolvedValue(mockConfig);
    
    vi.mocked(StressTestArchetypeGenerator).mockImplementation(() => ({
      generateBaselineArchetype: vi.fn().mockReturnValue(mockArchetypes[0]),
      generateSingleStatArchetypes: vi.fn().mockReturnValue([mockArchetypes[1]]),
      generatePairStatArchetypes: vi.fn().mockReturnValue([mockArchetypes[2]]),
    } as any));
    
    vi.mocked(MarginalUtilityCalculator).mockImplementation(() => ({
      setProgressCallback: vi.fn(),
      runAnalysis: vi.fn().mockResolvedValue(mockAnalysis),
    } as any));
    
    vi.mocked(saveData).mockResolvedValue(undefined);
    vi.mocked(exportStressTestTelemetry).mockReturnValue({});
    vi.mocked(getStressTestTelemetrySummary).mockReturnValue({
      totalEvents: 100,
      stats: { completedRuns: 95, failedRuns: 5, avgWinRate: 0.68 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration Loading', () => {
    it('should load default balancer config', async () => {
      await runStressPipeline({ iterations: 1000 });
      
      expect(BalancerConfigStore.load).toHaveBeenCalledTimes(1);
      expect(BalancerConfigStore.loadFromFile).not.toHaveBeenCalled();
    });

    it('should load custom config when specified', async () => {
      const customConfigPath = '/path/to/custom/config.json';
      await runStressPipeline({ configPath: customConfigPath });
      
      expect(BalancerConfigStore.loadFromFile).toHaveBeenCalledWith(customConfigPath);
      expect(BalancerConfigStore.load).not.toHaveBeenCalled();
    });

    it('should fallback to default config when custom config fails', async () => {
      const customConfigPath = '/path/to/invalid/config.json';
      vi.mocked(BalancerConfigStore.loadFromFile).mockRejectedValue(new Error('Config not found'));
      
      await runStressPipeline({ configPath: customConfigPath });
      
      expect(BalancerConfigStore.loadFromFile).toHaveBeenCalledWith(customConfigPath);
      expect(BalancerConfigStore.load).toHaveBeenCalledTimes(1);
    });

    it('should handle config loading failure gracefully', async () => {
      vi.mocked(BalancerConfigStore.load).mockRejectedValue(new Error('Config load failed'));
      
      await expect(runStressPipeline()).rejects.toThrow('Unable to load balancer configuration');
    });
  });

  describe('Pipeline Execution', () => {
    it('should run complete pipeline with default config', async () => {
      await runStressPipeline({ iterations: 1000, seed: 12345 });
      
      // Check archetype generation
      expect(StressTestArchetypeGenerator).toHaveBeenCalledWith(mockConfig, 12345);
      
      // Check analysis execution
      expect(MarginalUtilityCalculator).toHaveBeenCalledWith({
        simulation: { simulationCount: 1000, concurrencyLimit: 4, seed: 12345 },
        thresholds: { opThreshold: 1.15, weakThreshold: 0.95 },
        export: {
          enableJson: true,
          enableCsv: true,
          enableMarkdown: true,
          exportPath: '/data/exports/stressTesting',
        },
        enableLogging: true,
        enableCaching: true,
      });
      
      // Check progress callback setup
      const calculatorInstance = vi.mocked(MarginalUtilityCalculator).mock.instances[0];
      expect(calculatorInstance.setProgressCallback).toHaveBeenCalled();
    });

    it('should run export-only mode', async () => {
      await runStressPipeline({ exportOnly: true, enableTelemetry: true });
      
      // Should not generate archetypes or run analysis
      expect(StressTestArchetypeGenerator).not.toHaveBeenCalled();
      expect(MarginalUtilityCalculator).not.toHaveBeenCalled();
      
      // Should export telemetry
      expect(exportStressTestTelemetry).toHaveBeenCalled();
      expect(saveData).toHaveBeenCalledWith(
        expect.stringMatching(/telemetry-export-/),
        {}
      );
    });

    it('should respect custom configuration options', async () => {
      const customConfig = {
        iterations: 5000,
        seed: 99999,
        outputPath: '/custom/exports',
        enableTelemetry: false,
        enableLogging: false,
      };
      
      await runStressPipeline(customConfig);
      
      expect(MarginalUtilityCalculator).toHaveBeenCalledWith({
        simulation: { simulationCount: 5000, concurrencyLimit: 4, seed: 99999 },
        thresholds: { opThreshold: 1.15, weakThreshold: 0.95 },
        export: {
          enableJson: true,
          enableCsv: true,
          enableMarkdown: true,
          exportPath: '/custom/exports',
        },
        enableLogging: false,
        enableCaching: true,
      });
    });
  });

  describe('Metadata Persistence', () => {
    it('should save run metadata on completion', async () => {
      await runStressPipeline({ iterations: 1000 });
      
      // Check that metadata was saved twice (initial and final)
      expect(saveData).toHaveBeenCalledTimes(5); // metadata + 4 exports
      
      // Check final metadata structure
      const finalMetadataCall = vi.mocked(saveData).mock.calls[4];
      const metadataPath = finalMetadataCall[0];
      const metadata = finalMetadataCall[1];
      
      expect(metadataPath).toMatch(/run-metadata-stress-pipeline-/);
      expect(metadata).toMatchObject({
        id: expect.stringMatching(/^stress-pipeline-/),
        timestamp: expect.any(String),
        config: expect.objectContaining({
          iterations: 1000,
          seed: expect.any(Number),
          outputPath: '/data/exports/stressTesting',
          enableTelemetry: true,
          enableLogging: true,
        }),
        balancerConfigHash: expect.any(String),
        duration: expect.any(Number),
        status: 'completed',
        results: {
          archetypesGenerated: 3, // baseline + 1 single + 1 pair
          simulationsRun: 910000,
          analysesCompleted: 1,
          exportPaths: expect.arrayContaining([
            expect.stringContaining('.json'),
            expect.stringContaining('.csv'),
            expect.stringContaining('.md'),
            expect.stringContaining('telemetry-'),
          ]),
        },
      });
    });

    it('should save error metadata on failure', async () => {
      const error = new Error('Analysis failed');
      vi.mocked(MarginalUtilityCalculator.prototype.runAnalysis).mockRejectedValue(error);
      
      await expect(runStressPipeline()).rejects.toThrow('process.exit called');
      
      // Check error metadata
      const finalMetadataCall = vi.mocked(saveData).mock.calls[1];
      const metadata = finalMetadataCall[1];
      
      expect(metadata).toMatchObject({
        status: 'failed',
        error: 'Analysis failed',
        results: undefined,
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export analysis results', async () => {
      await runStressPipeline({ iterations: 1000 });
      
      // Check that analysis exports were saved
      expect(saveData).toHaveBeenCalledWith(
        expect.stringMatching(/mu-analysis-12345-2026-01-11.*\.json$/),
        mockAnalysis
      );
      expect(saveData).toHaveBeenCalledWith(
        expect.stringMatching(/mu-analysis-12345-2026-01-11.*\.csv$/),
        expect.any(String)
      );
      expect(saveData).toHaveBeenCalledWith(
        expect.stringMatching(/mu-analysis-12345-2026-01-11.*\.md$/),
        expect.any(String)
      );
    });

    it('should export telemetry when enabled', async () => {
      await runStressPipeline({ enableTelemetry: true });
      
      expect(exportStressTestTelemetry).toHaveBeenCalled();
      expect(saveData).toHaveBeenCalledWith(
        expect.stringMatching(/telemetry-mu-analysis-12345-2026-01-11.*\.json$/),
        {}
      );
    });

    it('should skip telemetry export when disabled', async () => {
      await runStressPipeline({ enableTelemetry: false });
      
      expect(exportStressTestTelemetry).not.toHaveBeenCalled();
      
      // Should still save analysis exports
      expect(saveData).toHaveBeenCalledTimes(4); // metadata + 3 analysis exports
    });

    it('should handle telemetry export failures gracefully', async () => {
      vi.mocked(exportStressTestTelemetry).mockImplementation(() => {
        throw new Error('Telemetry export failed');
      });
      
      await runStressPipeline({ enableTelemetry: true });
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[CLI] Failed to export telemetry:',
        expect.any(Error)
      );
      
      // Should still complete successfully
      expect(saveData).toHaveBeenCalledTimes(4); // metadata + 3 analysis exports
    });
  });

  describe('Logging and Output', () => {
    it('should log progress when enabled', async () => {
      await runStressPipeline({ enableLogging: true });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[CLI\] Starting stress testing pipeline/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[CLI\] Configuration:/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[CLI\] Loaded balancer config/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[CLI\] Generated \d+ archetypes/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[CLI\] Analysis completed/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[CLI\] ✅ Pipeline completed successfully!/)
      );
    });

    it('should suppress logging when disabled', async () => {
      await runStressPipeline({ enableLogging: false });
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should output JSON summary', async () => {
      await runStressPipeline({ enableLogging: false });
      
      // Check that JSON summary was output
      expect(consoleSpy).toHaveBeenCalledWith(
        '\n=== PIPELINE SUMMARY ==='
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"runId": "stress-pipeline-/)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/"status": "completed"/)
      );
    });

    it('should log telemetry summary when enabled', async () => {
      await runStressPipeline({ enableTelemetry: true });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CLI] Telemetry Summary:',
        {
          totalEvents: 100,
          stats: { completedRuns: 95, failedRuns: 5, avgWinRate: 0.68 },
        }
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle archetype generation failure', async () => {
      const error = new Error('Archetype generation failed');
      vi.mocked(StressTestArchetypeGenerator).mockImplementation(() => {
        throw error;
      });
      
      await expect(runStressPipeline()).rejects.toThrow('process.exit called');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[CLI] ❌ Pipeline failed',
        error
      );
    });

    it('should handle analysis failure', async () => {
      const error = new Error('Analysis failed');
      vi.mocked(MarginalUtilityCalculator.prototype.runAnalysis).mockRejectedValue(error);
      
      await expect(runStressPipeline()).rejects.toThrow('process.exit called');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[CLI] ❌ Pipeline failed',
        error
      );
    });

    it('should handle export failure', async () => {
      const error = new Error('Export failed');
      vi.mocked(saveData).mockRejectedValue(error);
      
      await expect(runStressPipeline()).rejects.toThrow('process.exit called');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[CLI] ❌ Pipeline failed',
        error
      );
    });

    it('should preserve partial results on failure', async () => {
      const error = new Error('Export failed');
      vi.mocked(saveData).mockRejectedValue(error);
      
      await expect(runStressPipeline()).rejects.toThrow('process.exit called');
      
      // Check that metadata was saved with error information
      expect(saveData).toHaveBeenCalledWith(
        expect.stringMatching(/run-metadata-/),
        expect.objectContaining({
          status: 'failed',
          error: 'Export failed',
        })
      );
    });
  });

  describe('Progress Tracking', () => {
    it('should set up progress callback', async () => {
      await runStressPipeline({ iterations: 1000 });
      
      const calculatorInstance = vi.mocked(MarginalUtilityCalculator).mock.instances[0];
      expect(calculatorInstance.setProgressCallback).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should log progress updates when enabled', async () => {
      await runStressPipeline({ enableLogging: true });
      
      // Get the progress callback
      const calculatorInstance = vi.mocked(MarginalUtilityCalculator).mock.instances[0];
      const progressCallback = vi.mocked(calculatorInstance.setProgressCallback).mock.calls[0][0];
      
      // Simulate progress update
      progressCallback({
        totalPairs: 10,
        completedPairs: 5,
        currentPair: 'pair_hp_damage',
        estimatedTimeRemaining: 120000,
        progressPercentage: 50,
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CLI] Progress: 50% (5/10)'
      );
    });

    it('should not log progress when disabled', async () => {
      await runStressPipeline({ enableLogging: false });
      
      const calculatorInstance = vi.mocked(MarginalUtilityCalculator).mock.instances[0];
      const progressCallback = vi.mocked(calculatorInstance.setProgressCallback).mock.calls[0][0];
      
      progressCallback({
        totalPairs: 10,
        completedPairs: 5,
        currentPair: 'pair_hp_damage',
        estimatedTimeRemaining: 120000,
        progressPercentage: 50,
      });
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/\[CLI\] Progress:/)
      );
    });
  });

  describe('Config Hash Calculation', () => {
    it('should calculate config hash for change detection', async () => {
      await runStressPipeline({ iterations: 1000 });
      
      const metadataCall = vi.mocked(saveData).mock.calls[4];
      const metadata = metadataCall[1];
      
      expect(metadata.balancerConfigHash).toMatch(/^[A-Za-z0-9+/]{16}$/);
    });

    it('should generate different hashes for different configs', async () => {
      const differentConfig = { ...mockConfig, stats: { ...mockConfig.stats } };
      differentConfig.stats.hp.defaultValue = 150;
      
      vi.mocked(BalancerConfigStore.load).mockResolvedValue(differentConfig);
      
      await runStressPipeline({ iterations: 1000 });
      
      const metadataCall = vi.mocked(saveData).mock.calls[4];
      const metadata = metadataCall[1];
      
      expect(metadata.balancerConfigHash).not.toBe('');
    });
  });

  describe('Run ID Generation', () => {
    it('should generate unique run IDs', async () => {
      const run1 = await runStressPipeline({ iterations: 100 });
      vi.clearAllMocks();
      
      // Reset mocks for second run
      vi.mocked(BalancerConfigStore.load).mockResolvedValue(mockConfig);
      vi.mocked(StressTestArchetypeGenerator).mockImplementation(() => ({
        generateBaselineArchetype: vi.fn().mockReturnValue(mockArchetypes[0]),
        generateSingleStatArchetypes: vi.fn().mockReturnValue([mockArchetypes[1]]),
        generatePairStatArchetypes: vi.fn().mockReturnValue([mockArchetypes[2]]),
      } as any));
      vi.mocked(MarginalUtilityCalculator).mockImplementation(() => ({
        setProgressCallback: vi.fn(),
        runAnalysis: vi.fn().mockResolvedValue(mockAnalysis),
      } as any));
      vi.mocked(saveData).mockResolvedValue(undefined);
      
      const run2 = await runStressPipeline({ iterations: 100 });
      
      const metadata1 = vi.mocked(saveData).mock.calls[4][1];
      const metadata2 = vi.mocked(saveData).mock.calls[9][1];
      
      expect(metadata1.id).not.toBe(metadata2.id);
      expect(metadata1.id).toMatch(/^stress-pipeline-/);
      expect(metadata2.id).toMatch(/^stress-pipeline-/);
    });
  });
});
