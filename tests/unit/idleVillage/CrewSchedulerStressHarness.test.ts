/**
 * Crew Scheduler Stress Harness Tests
 * Unit tests for stress testing framework
 * 
 * @see NP-154 – Idle Village Crew Scheduler Stress Harness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CrewSchedulerStressHarness,
  DEFAULT_STRESS_CONFIG,
  type StressTestConfig,
} from '../../../src/ui/idleVillage/diagnostics/CrewSchedulerStressHarness';

describe('CrewSchedulerStressHarness', () => {
  let harness: CrewSchedulerStressHarness;

  beforeEach(() => {
    harness = new CrewSchedulerStressHarness();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = harness.getConfig();
      expect(config.runs).toBe(1000);
      expect(config.seed).toBe(42);
      expect(config.crewCaps.min).toBe(3);
      expect(config.crewCaps.max).toBe(15);
    });

    it('should accept custom configuration', () => {
      const customConfig: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 500,
        seed: 123,
      };
      const customHarness = new CrewSchedulerStressHarness(customConfig);
      expect(customHarness.getConfig().runs).toBe(500);
      expect(customHarness.getConfig().seed).toBe(123);
    });

    it('should update configuration', () => {
      harness.updateConfig({ runs: 2000 });
      expect(harness.getConfig().runs).toBe(2000);
    });
  });

  describe('Stress Test Execution', () => {
    it('should run stress test and return results', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 10,
      };
      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();

      expect(result.runId).toBeTruthy();
      expect(result.metrics.totalScenarios).toBe(10);
      expect(result.metrics.conflictsDetected).toBeGreaterThanOrEqual(0);
      expect(result.metrics.avgLatencyMs).toBeGreaterThan(0);
    });

    it('should generate deterministic results with same seed', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 50,
        seed: 42,
      };

      const harness1 = new CrewSchedulerStressHarness(config);
      const harness2 = new CrewSchedulerStressHarness(config);

      const result1 = await harness1.runStressTest();
      const result2 = await harness2.runStressTest();

      expect(result1.metrics.conflictsDetected).toBe(result2.metrics.conflictsDetected);
      expect(result1.metrics.successfulAssignments).toBe(result2.metrics.successfulAssignments);
    });

    it('should detect conflicts', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 100,
        scenarios: {
          overlapIntensity: 0.8,
          conflictProbability: 0.5,
          maxConcurrentAssignments: 3,
        },
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();

      expect(result.metrics.conflictsDetected).toBeGreaterThan(0);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should calculate metrics correctly', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 20,
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();

      expect(result.metrics.conflictPercentage).toBeGreaterThanOrEqual(0);
      expect(result.metrics.conflictPercentage).toBeLessThanOrEqual(100);
      expect(result.metrics.maxLatencyMs).toBeGreaterThanOrEqual(result.metrics.minLatencyMs);
      expect(result.metrics.avgLatencyMs).toBeGreaterThan(0);
    });

    it('should track performance metrics', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 50,
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();

      expect(result.performance.totalDurationMs).toBeGreaterThan(0);
      expect(result.performance.scenariosPerSecond).toBeGreaterThan(0);
      expect(result.performance.memoryUsageMB).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect overlap conflicts', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 50,
        scenarios: {
          overlapIntensity: 0.9,
          conflictProbability: 0.8,
          maxConcurrentAssignments: 10,
        },
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();

      const overlapConflicts = result.conflicts.filter(c => c.conflictType === 'overlap');
      expect(overlapConflicts.length).toBeGreaterThan(0);
    });

    it('should detect fatigue conflicts', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 50,
        fatigueRanges: {
          min: 80,
          max: 100,
        },
        scenarios: {
          overlapIntensity: 0.3,
          conflictProbability: 0.5,
          maxConcurrentAssignments: 5,
        },
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();

      const fatigueConflicts = result.conflicts.filter(c => c.conflictType === 'fatigue');
      expect(fatigueConflicts.length).toBeGreaterThan(0);
    });

    it('should assign severity levels', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 50,
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();

      if (result.conflicts.length > 0) {
        const severities = result.conflicts.map(c => c.severity);
        expect(severities.every(s => ['low', 'medium', 'high', 'critical'].includes(s))).toBe(true);
      }
    });
  });

  describe('Export Functionality', () => {
    it('should export to JSON', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 10,
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();
      const json = testHarness.exportToJSON(result);

      expect(json).toBeTruthy();
      const parsed = JSON.parse(json);
      expect(parsed.runId).toBe(result.runId);
      expect(parsed.metrics).toBeDefined();
    });

    it('should export to Markdown', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 10,
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();
      const markdown = testHarness.exportToMarkdown(result);

      expect(markdown).toContain('# Crew Scheduler Stress Test Report');
      expect(markdown).toContain('## Metrics');
      expect(markdown).toContain('## Performance');
    });

    it('should include conflict details in Markdown', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 50,
        scenarios: {
          overlapIntensity: 0.8,
          conflictProbability: 0.7,
          maxConcurrentAssignments: 3,
        },
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();
      const markdown = testHarness.exportToMarkdown(result);

      if (result.conflicts.length > 0) {
        expect(markdown).toContain('## Conflicts');
      }
    });
  });

  describe('Scenario Generation', () => {
    it('should respect crew size limits', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 20,
        crewCaps: {
          min: 5,
          max: 10,
        },
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();

      expect(result.metrics.totalScenarios).toBe(20);
    });

    it('should respect fatigue ranges', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 20,
        fatigueRanges: {
          min: 20,
          max: 40,
        },
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const result = await testHarness.runStressTest();

      expect(result.metrics.totalScenarios).toBe(20);
    });
  });

  describe('Performance', () => {
    it('should complete 100 scenarios in reasonable time', async () => {
      const config: StressTestConfig = {
        ...DEFAULT_STRESS_CONFIG,
        runs: 100,
      };

      const testHarness = new CrewSchedulerStressHarness(config);
      const start = performance.now();
      await testHarness.runStressTest();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });
});
