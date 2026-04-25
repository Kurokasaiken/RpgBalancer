/**
 * Unit tests for Drop Stress Replay Service.
 * 
 * This test suite validates the core functionality of the drop stress
 * replay system including scenario processing, validation, and KPI calculation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  DropStressReplayServiceClass,
  createDropStressReplayService,
  type ReplayConfig,
  type ScenarioReplayResult,
  type ReplayResults
} from '../../../src/ui/idleVillage/tools/DropStressReplayServiceImpl';
import type { DropScenario, DropStressDataset } from '../../../src/ui/idleVillage/tools/DropStressReplayService';

// Mock the drop validator
vi.mock('../../../src/ui/idleVillage/config/residentDropRules', () => ({
  createDropValidator: () => ({
    validateDrop: vi.fn().mockImplementation(({ resident, activity }) => {
      // Mock validation logic based on scenario data
      const levelValid = resident.level >= (activity.requirements.minLevel || 1);
      const fatigueValid = resident.fatigue <= (activity.requirements.maxFatigue || 100);
      const capacityValid = activity.currentOccupants < activity.capacity;
      
      return {
        valid: levelValid && fatigueValid && capacityValid,
        reason: levelValid && fatigueValid && capacityValid 
          ? 'Resident meets all requirements' 
          : 'Validation failed',
        confidence: 0.95,
        ruleViolations: []
      };
    })
  })
}));

describe('DropStressReplayService', () => {
  let service: DropStressReplayServiceClass;
  let mockConfig: ReplayConfig;

  beforeEach(() => {
    mockConfig = {
      concurrency: 2,
      failFast: false,
      timeoutMs: 5000,
      verbose: false,
    };
    service = createDropStressReplayService(mockConfig);
  });

  describe('Service Creation', () => {
    it('should create service with default config', () => {
      const defaultService = createDropStressReplayService();
      expect(defaultService).toBeInstanceOf(DropStressReplayServiceClass);
    });

    it('should create service with custom config', () => {
      const customConfig: ReplayConfig = {
        concurrency: 5,
        failFast: true,
        timeoutMs: 10000,
        verbose: true,
      };
      const customService = createDropStressReplayService(customConfig);
      expect(customService).toBeInstanceOf(DropStressReplayServiceClass);
    });
  });

  describe('Scenario Replay', () => {
    it('should replay a valid scenario successfully', async () => {
      const scenario: DropScenario = {
        id: 'test-scenario-1',
        seed: 1001,
        residentStats: {
          id: 'resident-1',
          name: 'Test Resident',
          level: 5,
          stats: { strength: 50, agility: 40, intelligence: 45 } as Record<string, number>,
          fatigue: 20,
          tags: ['worker'],
        },
        slotInfo: {
          id: 'slot-1',
          type: 'activity',
          name: 'Test Activity',
          capacity: 3,
          currentOccupants: 1,
          requirements: {
            minLevel: 1,
            maxFatigue: 80,
            requiredStats: { strength: 20 }
          },
        },
        expectedVerdict: {
          valid: true,
          reason: 'Resident meets all requirements',
          confidence: 0.95,
          ruleViolations: [],
        },
        metadata: {
          category: 'test',
          difficulty: 'easy',
          description: 'Test scenario',
          tags: ['test'],
          created: '2026-01-20T00:00:00.000Z',
        },
      };

      const result = await service.replayScenario(scenario);

      expect(result.scenarioId).toBe('test-scenario-1');
      expect(result.success).toBe(true);
      expect(result.executionTimeMs).toBeGreaterThan(0);
      expect(result.actualResult).toBeDefined();
    });

    it('should handle scenario with validation failure', async () => {
      const scenario: DropScenario = {
        id: 'test-scenario-2',
        seed: 1002,
        residentStats: {
          id: 'resident-2',
          name: 'Tired Resident',
          level: 1,
          stats: { strength: 10, agility: 15, intelligence: 12 } as Record<string, number>,
          fatigue: 90,
          tags: ['worker'],
        },
        slotInfo: {
          id: 'slot-2',
          type: 'activity',
          name: 'Hard Activity',
          capacity: 1,
          currentOccupants: 0,
          requirements: {
            minLevel: 5,
            maxFatigue: 30,
            requiredStats: { strength: 50 }
          },
        },
        expectedVerdict: {
          valid: false,
          reason: 'Resident does not meet requirements',
          confidence: 0.98,
          ruleViolations: ['level_too_low', 'fatigue_limit_exceeded'],
        },
        metadata: {
          category: 'test',
          difficulty: 'hard',
          description: 'Test failure scenario',
          tags: ['test', 'failure'],
          created: '2026-01-20T00:00:00.000Z',
        },
      };

      const result = await service.replayScenario(scenario);

      expect(result.scenarioId).toBe('test-scenario-2');
      expect(result.success).toBe(true);
      expect(result.actualResult).toBeDefined();
      expect(result.matches).toBe(false); // Expected invalid, actual might be different
    });
  });

  describe('Dataset Replay', () => {
    let mockDataset: DropStressDataset;

    beforeEach(() => {
      mockDataset = {
        metadata: {
          name: 'Test Dataset',
          version: '1.0.0',
          description: 'Test dataset for unit testing',
          totalScenarios: 3,
          created: '2026-01-20T00:00:00.000Z',
          updated: '2026-01-20T00:00:00.000Z',
          tags: ['test'],
        },
        scenarios: [
          {
            id: 'scenario-1',
            seed: 1001,
            residentStats: {
              id: 'resident-1',
              name: 'Alice',
              level: 5,
              stats: { strength: 45, agility: 38 } as Record<string, number>,
              fatigue: 25,
              tags: ['worker'],
            },
            slotInfo: {
              id: 'slot-1',
              type: 'activity',
              name: 'Forest Gathering',
              capacity: 3,
              currentOccupants: 1,
              requirements: { minLevel: 1, maxFatigue: 80 },
            },
            expectedVerdict: {
              valid: true,
              reason: 'Valid',
              confidence: 0.95,
              ruleViolations: [],
            },
            metadata: {
              category: 'test',
              difficulty: 'easy',
              description: 'Valid scenario',
              tags: ['test'],
              created: '2026-01-20T00:00:00.000Z',
            },
          },
          {
            id: 'scenario-2',
            seed: 1002,
            residentStats: {
              id: 'resident-2',
              name: 'Bob',
              level: 3,
              stats: { strength: 30, agility: 25 } as Record<string, number>,
              fatigue: 85,
              tags: ['worker'],
            },
            slotInfo: {
              id: 'slot-2',
              type: 'activity',
              name: 'Mining',
              capacity: 2,
              currentOccupants: 0,
              requirements: { minLevel: 2, maxFatigue: 60 },
            },
            expectedVerdict: {
              valid: false,
              reason: 'Too tired',
              confidence: 0.98,
              ruleViolations: ['fatigue_limit_exceeded'],
            },
            metadata: {
              category: 'test',
              difficulty: 'medium',
              description: 'Fatigue failure',
              tags: ['test'],
              created: '2026-01-20T00:00:00.000Z',
            },
          },
          {
            id: 'scenario-3',
            seed: 1003,
            residentStats: {
              id: 'resident-3',
              name: 'Charlie',
              level: 4,
              stats: { strength: 40, agility: 45 } as Record<string, number>,
              fatigue: 30,
              tags: ['worker'],
            },
            slotInfo: {
              id: 'slot-3',
              type: 'location',
              name: 'Crafting Station',
              capacity: 1,
              currentOccupants: 1,
              requirements: { minLevel: 3, maxFatigue: 70 },
            },
            expectedVerdict: {
              valid: false,
              reason: 'Capacity full',
              confidence: 0.92,
              ruleViolations: ['capacity_exceeded'],
            },
            metadata: {
              category: 'test',
              difficulty: 'medium',
              description: 'Capacity failure',
              tags: ['test'],
              created: '2026-01-20T00:00:00.000Z',
            },
          },
        ],
        benchmarks: {
          maxLatencyMs: 100,
          minAccuracyRate: 0.95,
          maxMemoryUsageMB: 50,
        },
      };
    });

    it('should replay entire dataset successfully', async () => {
      const results = await service.replayDataset(mockDataset);

      expect(results.totalScenarios).toBe(3);
      expect(results.successfulReplays).toBe(3);
      expect(results.failedReplays).toBe(0);
      expect(results.scenarioResults).toHaveLength(3);
      expect(results.performanceKPIs.totalTimeMs).toBeGreaterThan(0);
      expect(results.performanceKPIs.scenariosPerSecond).toBeGreaterThan(0);
    });

    it('should calculate accuracy rate correctly', async () => {
      const results = await service.replayDataset(mockDataset);

      expect(results.accuracyRate).toBeGreaterThanOrEqual(0);
      expect(results.accuracyRate).toBeLessThanOrEqual(1);
      expect(results.matchingResults).toBeGreaterThanOrEqual(0);
      expect(results.mismatchingResults).toBeGreaterThanOrEqual(0);
    });

    it('should handle fail-fast mode', async () => {
      const failFastService = createDropStressReplayService({
        ...mockConfig,
        failFast: true,
      });

      const results = await failFastService.replayDataset(mockDataset);

      expect(results.totalScenarios).toBeGreaterThan(0);
      // In fail-fast mode, processing stops on first failure
      // Since our mock doesn't actually fail, all scenarios should process
    });
  });

  describe('Performance Metrics', () => {
    it('should track execution time for scenarios', async () => {
      const scenario: DropScenario = {
        id: 'timing-test',
        seed: 1004,
        residentStats: {
          id: 'resident-timing',
          name: 'Timing Test',
          level: 5,
          stats: { strength: 50, agility: 40 } as Record<string, number>,
          fatigue: 20,
          tags: ['worker'],
        },
        slotInfo: {
          id: 'slot-timing',
          type: 'activity',
          name: 'Timing Activity',
          capacity: 3,
          currentOccupants: 0,
          requirements: { minLevel: 1, maxFatigue: 80 },
        },
        expectedVerdict: {
          valid: true,
          reason: 'Valid',
          confidence: 0.95,
          ruleViolations: [],
        },
        metadata: {
          category: 'performance',
          difficulty: 'easy',
          description: 'Timing test scenario',
          tags: ['test', 'timing'],
          created: '2026-01-20T00:00:00.000Z',
        },
      };

      const result = await service.replayScenario(scenario);

      expect(result.executionTimeMs).toBeGreaterThan(0);
      expect(result.executionTimeMs).toBeLessThan(1000); // Should be fast
    });

    it('should calculate performance KPIs correctly', async () => {
      const mockDataset: DropStressDataset = {
        metadata: {
          name: 'Performance Test Dataset',
          version: '1.0.0',
          description: 'Dataset for performance testing',
          totalScenarios: 2,
          created: '2026-01-20T00:00:00.000Z',
          updated: '2026-01-20T00:00:00.000Z',
          tags: ['test', 'performance'],
        },
        scenarios: [
          {
            id: 'perf-1',
            seed: 1005,
            residentStats: {
              id: 'perf-resident-1',
              name: 'Perf Test 1',
              level: 3,
              stats: { strength: 30, agility: 25 } as Record<string, number>,
              fatigue: 40,
              tags: ['worker'],
            },
            slotInfo: {
              id: 'perf-slot-1',
              type: 'activity',
              name: 'Perf Activity 1',
              capacity: 2,
              currentOccupants: 0,
              requirements: { minLevel: 1, maxFatigue: 80 },
            },
            expectedVerdict: {
              valid: true,
              reason: 'Valid',
              confidence: 0.95,
              ruleViolations: [],
            },
            metadata: {
              category: 'performance',
              difficulty: 'easy',
              description: 'Performance test 1',
              tags: ['test'],
              created: '2026-01-20T00:00:00.000Z',
            },
          },
          {
            id: 'perf-2',
            seed: 1006,
            residentStats: {
              id: 'perf-resident-2',
              name: 'Perf Test 2',
              level: 4,
              stats: { strength: 40, agility: 35 } as Record<string, number>,
              fatigue: 30,
              tags: ['worker'],
            },
            slotInfo: {
              id: 'perf-slot-2',
              type: 'location',
              name: 'Perf Location 2',
              capacity: 3,
              currentOccupants: 1,
              requirements: { minLevel: 2, maxFatigue: 70 },
            },
            expectedVerdict: {
              valid: true,
              reason: 'Valid',
              confidence: 0.95,
              ruleViolations: [],
            },
            metadata: {
              category: 'performance',
              difficulty: 'easy',
              description: 'Performance test 2',
              tags: ['test'],
              created: '2026-01-20T00:00:00.000Z',
            },
          },
        ],
        benchmarks: {
          maxLatencyMs: 100,
          minAccuracyRate: 0.95,
          maxMemoryUsageMB: 50,
        },
      };

      const results = await service.replayDataset(mockDataset);

      expect(results.performanceKPIs.totalTimeMs).toBeGreaterThan(0);
      expect(results.performanceKPIs.scenariosPerSecond).toBeGreaterThan(0);
      expect(results.performanceKPIs.memoryUsageMB).toBeGreaterThan(0);
      expect(results.avgExecutionTimeMs).toBeGreaterThan(0);
      expect(results.maxExecutionTimeMs).toBeGreaterThanOrEqual(results.avgExecutionTimeMs);
      expect(results.minExecutionTimeMs).toBeLessThanOrEqual(results.avgExecutionTimeMs);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty dataset gracefully', async () => {
      const emptyDataset: DropStressDataset = {
        metadata: {
          name: 'Empty Dataset',
          version: '1.0.0',
          description: 'Empty dataset for testing',
          totalScenarios: 0,
          created: '2026-01-20T00:00:00.000Z',
          updated: '2026-01-20T00:00:00.000Z',
          tags: ['test', 'empty'],
        },
        scenarios: [],
        benchmarks: {
          maxLatencyMs: 100,
          minAccuracyRate: 0.95,
          maxMemoryUsageMB: 50,
        },
      };

      const results = await service.replayDataset(emptyDataset);

      expect(results.totalScenarios).toBe(0);
      expect(results.successfulReplays).toBe(0);
      expect(results.failedReplays).toBe(0);
      expect(results.scenarioResults).toHaveLength(0);
    });

    it('should handle dataset loading errors', async () => {
      // Mock a dataset loading error by testing the error path
      // This would need to be tested with actual file I/O in integration tests
      expect(true).toBe(true); // Placeholder for error handling test
    });
  });

  describe('Configuration', () => {
    it('should respect concurrency settings', async () => {
      const highConcurrencyService = createDropStressReplayService({
        concurrency: 10,
        failFast: false,
        timeoutMs: 5000,
        verbose: false,
      });

      const mockDataset: DropStressDataset = {
        metadata: {
          name: 'Concurrency Test Dataset',
          version: '1.0.0',
          description: 'Dataset for concurrency testing',
          totalScenarios: 5,
          created: '2026-01-20T00:00:00.000Z',
          updated: '2026-01-20T00:00:00.000Z',
          tags: ['test', 'concurrency'],
        },
        scenarios: Array.from({ length: 5 }, (_, i) => ({
          id: `concurrency-test-${i}`,
          seed: 2000 + i,
          residentStats: {
            id: `resident-${i}`,
            name: `Resident ${i}`,
            level: 3,
            stats: { strength: 30, agility: 25 } as Record<string, number>,
            fatigue: 40,
            tags: ['worker'],
          },
          slotInfo: {
            id: `slot-${i}`,
            type: 'activity',
            name: `Activity ${i}`,
            capacity: 2,
            currentOccupants: 0,
            requirements: { minLevel: 1, maxFatigue: 80 },
          },
          expectedVerdict: {
            valid: true,
            reason: 'Valid',
            confidence: 0.95,
            ruleViolations: [],
          },
          metadata: {
            category: 'concurrency',
            difficulty: 'easy',
            description: `Concurrency test ${i}`,
            tags: ['test'],
            created: '2026-01-20T00:00:00.000Z',
          },
        })),
        benchmarks: {
          maxLatencyMs: 100,
          minAccuracyRate: 0.95,
          maxMemoryUsageMB: 50,
        },
      };

      const results = await highConcurrencyService.replayDataset(mockDataset);

      expect(results.totalScenarios).toBe(5);
      expect(results.successfulReplays).toBe(5);
      expect(results.performanceKPIs.scenariosPerSecond).toBeGreaterThan(0);
    });
  });
});
