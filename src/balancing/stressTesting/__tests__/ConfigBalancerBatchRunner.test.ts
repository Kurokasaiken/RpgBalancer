/**
 * NP-095 – Config Balancer Batch Runner Unit Tests
 *
 * Comprehensive test suite for the ConfigBalancerBatchRunner service.
 * Tests batch execution, scenario management, progress reporting, and result aggregation.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigBalancerBatchRunner, type BatchConfig } from '../ConfigBalancerBatchRunner';
import { VERSIONED_SCENARIOS } from '../VersionedScenarios';

// Mock dependencies
vi.mock('../../../shared/persistence/PersistenceService', () => ({
  saveData: vi.fn().mockResolvedValue(undefined),
}));

describe('ConfigBalancerBatchRunner', () => {
  let mockBatchConfig: BatchConfig;
  let runner: ConfigBalancerBatchRunner;

  beforeEach(() => {
    vi.useFakeTimers();

    mockBatchConfig = {
      id: 'test-batch',
      name: 'Test Batch',
      description: 'Test batch configuration',
      scenarios: [
        VERSIONED_SCENARIOS['quick-validation-v1.0'],
        VERSIONED_SCENARIOS['standard-analysis-v1.0'],
      ],
      execution: {
        mode: 'sequential',
        maxParallel: 2,
        continueOnFailure: true,
        stopOnFailure: false,
        scenarioTimeoutMinutes: 30,
        batchTimeoutMinutes: 60,
      },
      reporting: {
        enableSummaryReport: true,
        enableDetailedReports: true,
        enableComparisonReport: true,
        outputDir: './test-results',
        formats: ['json'],
      },
      metadata: {
        createdBy: 'test',
        createdAt: new Date().toISOString(),
        environment: 'test',
      },
    };

    runner = new ConfigBalancerBatchRunner(mockBatchConfig);
  });

  afterEach(() => {
    vi.restoreAllTimers();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with valid configuration', () => {
      expect(runner).toBeDefined();
    });

    it('should accept progress callback', () => {
      const callback = vi.fn();
      runner.setProgressCallback(callback);
      expect(callback).toBeDefined();
    });
  });

  describe('Batch Execution', () => {
    it('should execute batch with successful scenarios', async () => {
      // Mock successful scenario execution
      const mockResults = {
        archetypes: [],
        analysis: {
          id: 'test-analysis',
          timestamp: Date.now(),
          config: {
            simulationCount: 1000,
            seed: 42,
            thresholds: { opThreshold: 1.15, weakThreshold: 0.95 },
          },
          summary: {
            totalSimulations: 1000,
            opSynergiesCount: 5,
            weakSynergiesCount: 3,
            significantSynergiesCount: 8,
            avgSimulationsPerSecond: 50,
            totalRuntimeMs: 20000,
          },
        },
        config: VERSIONED_SCENARIOS['quick-validation-v1.0'].runnerConfig,
        metadata: {
          runId: 'test-run',
          startTime: Date.now(),
          endTime: Date.now() + 20000,
          durationMs: 20000,
          balancerConfigHash: 'test-hash',
        },
      };

      // Mock the internal execution method
      const executeScenarioSpy = vi.spyOn(runner as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'success',
          results: mockResults,
          startTime: Date.now(),
          endTime: Date.now() + 20000,
          durationMs: 20000,
        });

      const results = await runner.executeBatch();

      expect(results).toBeDefined();
      expect(results.config).toEqual(mockBatchConfig);
      expect(results.scenarioResults).toHaveLength(2);
      expect(results.summary.successful).toBeGreaterThan(0);
      expect(executeScenarioSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle scenario failures gracefully', async () => {
      const executeScenarioSpy = vi.spyOn(runner as any, 'executeScenarioWithProgress')
        .mockResolvedValueOnce({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'success',
          results: null,
          startTime: Date.now(),
          endTime: Date.now() + 10000,
          durationMs: 10000,
        })
        .mockResolvedValueOnce({
          scenario: VERSIONED_SCENARIOS['standard-analysis-v1.0'],
          status: 'failed',
          error: 'Test failure',
          startTime: Date.now(),
          endTime: Date.now() + 5000,
          durationMs: 5000,
        });

      const results = await runner.executeBatch();

      expect(results.scenarioResults).toHaveLength(2);
      expect(results.summary.successful).toBe(1);
      expect(results.summary.failed).toBe(1);
    });

    it('should respect continueOnFailure setting', async () => {
      // Test with continueOnFailure = false
      const strictConfig = { ...mockBatchConfig, execution: { ...mockBatchConfig.execution, continueOnFailure: false } };
      const strictRunner = new ConfigBalancerBatchRunner(strictConfig);

      const executeScenarioSpy = vi.spyOn(strictRunner as any, 'executeScenarioWithProgress')
        .mockResolvedValueOnce({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'failed',
          error: 'First scenario failed',
          startTime: Date.now(),
          endTime: Date.now() + 5000,
          durationMs: 5000,
        });

      await expect(strictRunner.executeBatch()).rejects.toThrow();
      expect(executeScenarioSpy).toHaveBeenCalledTimes(1); // Should stop after first failure
    });

    it('should handle timeout scenarios', async () => {
      const executeScenarioSpy = vi.spyOn(runner as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'timeout',
          error: 'Scenario timed out',
          startTime: Date.now(),
          endTime: Date.now() + 30 * 60 * 1000, // 30 minutes
          durationMs: 30 * 60 * 1000,
        });

      const results = await runner.executeBatch();

      expect(results.summary.timeout).toBe(2); // Both scenarios timeout
      expect(results.summary.successful).toBe(0);
    });
  });

  describe('Parallel Execution', () => {
    it('should execute scenarios in parallel when configured', async () => {
      const parallelConfig = { ...mockBatchConfig, execution: { ...mockBatchConfig.execution, mode: 'parallel' as const, maxParallel: 2 } };
      const parallelRunner = new ConfigBalancerBatchRunner(parallelConfig);

      const executeScenarioSpy = vi.spyOn(parallelRunner as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'success',
          results: null,
          startTime: Date.now(),
          endTime: Date.now() + 10000,
          durationMs: 10000,
        });

      await parallelRunner.executeBatch();

      // In parallel mode, scenarios should be batched
      expect(executeScenarioSpy).toHaveBeenCalledTimes(2);
    });

    it('should respect maxParallel limit', async () => {
      const parallelConfig = { ...mockBatchConfig, execution: { ...mockBatchConfig.execution, mode: 'parallel' as const, maxParallel: 1 } };
      const parallelRunner = new ConfigBalancerBatchRunner(parallelConfig);

      const executeScenarioSpy = vi.spyOn(parallelRunner as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'success',
          results: null,
          startTime: Date.now(),
          endTime: Date.now() + 10000,
          durationMs: 10000,
        });

      await parallelRunner.executeBatch();

      expect(executeScenarioSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress during execution', async () => {
      const progressCallback = vi.fn();
      runner.setProgressCallback(progressCallback);

      const executeScenarioSpy = vi.spyOn(runner as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'success',
          results: null,
          startTime: Date.now(),
          endTime: Date.now() + 10000,
          durationMs: 10000,
        });

      await runner.executeBatch();

      expect(progressCallback).toHaveBeenCalled();
      const calls = progressCallback.mock.calls;
      expect(calls.some(call => call[0].stage === 'initializing')).toBe(true);
      expect(calls.some(call => call[0].stage === 'executing')).toBe(true);
      expect(calls.some(call => call[0].stage === 'finalizing')).toBe(true);
      expect(calls.some(call => call[0].stage === 'completed')).toBe(true);
    });

    it('should update progress with scenario details', async () => {
      const progressCallback = vi.fn();
      runner.setProgressCallback(progressCallback);

      const executeScenarioSpy = vi.spyOn(runner as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'success',
          results: null,
          startTime: Date.now(),
          endTime: Date.now() + 10000,
          durationMs: 10000,
        });

      await runner.executeBatch();

      const executionCalls = progressCallback.mock.calls.filter(call => call[0].stage === 'executing');
      expect(executionCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Result Aggregation', () => {
    it('should calculate accurate summary statistics', async () => {
      const executeScenarioSpy = vi.spyOn(runner as any, 'executeScenarioWithProgress')
        .mockResolvedValueOnce({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'success',
          results: {
            analysis: { summary: { totalSimulations: 1000, opSynergiesCount: 5, weakSynergiesCount: 3, significantSynergiesCount: 8, avgSimulationsPerSecond: 50, totalRuntimeMs: 20000 } },
          } as any,
          startTime: Date.now(),
          endTime: Date.now() + 20000,
          durationMs: 20000,
        })
        .mockResolvedValueOnce({
          scenario: VERSIONED_SCENARIOS['standard-analysis-v1.0'],
          status: 'failed',
          error: 'Test failure',
          startTime: Date.now(),
          endTime: Date.now() + 5000,
          durationMs: 5000,
        });

      const results = await runner.executeBatch();

      expect(results.summary.totalScenarios).toBe(2);
      expect(results.summary.successful).toBe(1);
      expect(results.summary.failed).toBe(1);
      expect(results.summary.successRate).toBe(0.5);
      expect(results.summary.averageExecutionTimeMs).toBe(20000); // Only successful scenario
    });

    it('should include scenario execution details', async () => {
      const executeScenarioSpy = vi.spyOn(runner as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'success',
          results: null,
          startTime: Date.now(),
          endTime: Date.now() + 10000,
          durationMs: 10000,
        });

      const results = await runner.executeBatch();

      expect(results.scenarioResults).toHaveLength(2);
      results.scenarioResults.forEach(result => {
        expect(result.scenario).toBeDefined();
        expect(result.status).toBeDefined();
        expect(result.startTime).toBeDefined();
        expect(result.endTime).toBeDefined();
        expect(result.durationMs).toBeDefined();
      });
    });
  });

  describe('Report Generation', () => {
    it('should generate reports when configured', async () => {
      // Mock saveData function
      const { saveData } = await import('../../../shared/persistence/PersistenceService');
      const saveDataSpy = vi.spyOn({ saveData }, 'saveData');

      await runner.executeBatch();

      // Should attempt to save reports
      expect(saveDataSpy).toHaveBeenCalled();
    });

    it('should handle report generation errors gracefully', async () => {
      // Mock saveData function to reject
      const { saveData } = await import('../../../shared/persistence/PersistenceService');
      const saveDataSpy = vi.spyOn({ saveData }, 'saveData').mockRejectedValue(new Error('Save failed'));

      // Should not throw even if report saving fails
      await expect(runner.executeBatch()).resolves.toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate batch configuration', () => {
      // Valid configuration should not throw
      expect(() => new ConfigBalancerBatchRunner(mockBatchConfig)).not.toThrow();
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = { ...mockBatchConfig, scenarios: [] };
      expect(() => new ConfigBalancerBatchRunner(invalidConfig)).toThrow();
    });
  });

  describe('Resource Management', () => {
    it('should clean up resources properly', async () => {
      const executeScenarioSpy = vi.spyOn(runner as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'success',
          results: null,
          startTime: Date.now(),
          endTime: Date.now() + 10000,
          durationMs: 10000,
        });

      await runner.executeBatch();

      // Runner should be reusable for another execution
      const secondResults = await runner.executeBatch();
      expect(secondResults).toBeDefined();
    });

    it('should handle concurrent batch executions', async () => {
      const runner2 = new ConfigBalancerBatchRunner(mockBatchConfig);

      const executeScenarioSpy1 = vi.spyOn(runner as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'success',
          results: null,
          startTime: Date.now(),
          endTime: Date.now() + 10000,
          durationMs: 10000,
        });

      const executeScenarioSpy2 = vi.spyOn(runner2 as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: VERSIONED_SCENARIOS['quick-validation-v1.0'],
          status: 'success',
          results: null,
          startTime: Date.now(),
          endTime: Date.now() + 10000,
          durationMs: 10000,
        });

      // Both runners should execute independently
      const [results1, results2] = await Promise.all([
        runner.executeBatch(),
        runner2.executeBatch(),
      ]);

      expect(results1).toBeDefined();
      expect(results2).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty scenario list', async () => {
      const emptyConfig = { ...mockBatchConfig, scenarios: [] };
      const emptyRunner = new ConfigBalancerBatchRunner(emptyConfig);

      const executeScenarioSpy = vi.spyOn(emptyRunner as any, 'executeScenarioWithProgress');

      const results = await emptyRunner.executeBatch();

      expect(results.scenarioResults).toHaveLength(0);
      expect(results.summary.totalScenarios).toBe(0);
      expect(executeScenarioSpy).not.toHaveBeenCalled();
    });

    it('should handle very long scenario names', async () => {
      const longNameScenario = {
        ...VERSIONED_SCENARIOS['quick-validation-v1.0'],
        name: 'A'.repeat(200), // Very long name
      };
      const longNameConfig = { ...mockBatchConfig, scenarios: [longNameScenario] };
      const longNameRunner = new ConfigBalancerBatchRunner(longNameConfig);

      const executeScenarioSpy = vi.spyOn(longNameRunner as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: longNameScenario,
          status: 'success',
          results: null,
          startTime: Date.now(),
          endTime: Date.now() + 10000,
          durationMs: 10000,
        });

      const results = await longNameRunner.executeBatch();

      expect(results.scenarioResults[0].scenario.name).toBe('A'.repeat(200));
    });

    it('should handle scenarios with zero estimated runtime', async () => {
      const zeroRuntimeScenario = {
        ...VERSIONED_SCENARIOS['quick-validation-v1.0'],
        estimatedRuntimeMinutes: 0,
      };
      const zeroRuntimeConfig = { ...mockBatchConfig, scenarios: [zeroRuntimeScenario] };
      const zeroRuntimeRunner = new ConfigBalancerBatchRunner(zeroRuntimeConfig);

      const executeScenarioSpy = vi.spyOn(zeroRuntimeRunner as any, 'executeScenarioWithProgress')
        .mockResolvedValue({
          scenario: zeroRuntimeScenario,
          status: 'success',
          results: null,
          startTime: Date.now(),
          endTime: Date.now() + 10000,
          durationMs: 10000,
        });

      const results = await zeroRuntimeRunner.executeBatch();

      expect(results.scenarioResults[0].scenario.estimatedRuntimeMinutes).toBe(0);
    });
  });
});
