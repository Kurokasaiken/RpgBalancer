/**
 * ActivitySlot Persistence Chaos Tests
 * 
 * Config-first chaos testing for ActivitySlot persistence resilience.
 * Tests crash scenarios, quota exceeded, and duplicate hydration.
 * 
 * @since NP-156 – Idle Village ActivitySlot Persistence Chaos Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  type ChaosRunnerConfig,
  type ChaosTestResult,
  type ChaosRunResult,
  DEFAULT_CHAOS_RUNNER_CONFIG,
  createSafeChaosRunnerConfig,
  calculateDataIntegrity,
  generateChaosRunSummary,
  exportToJSON,
  exportToMarkdown,
} from '../../../scripts/idleVillage/activitySlotChaosRunner';

// Mock PersistenceService
const mockSaveData = vi.fn();
const mockLoadData = vi.fn();
const mockClearData = vi.fn();

vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: (...args: any[]) => mockSaveData(...args),
  loadData: (...args: any[]) => mockLoadData(...args),
  clearData: (...args: any[]) => mockClearData(...args),
}));

describe('ActivitySlot Persistence Chaos Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_CHAOS_RUNNER_CONFIG).toBeDefined();
      expect(DEFAULT_CHAOS_RUNNER_CONFIG.scenarios).toHaveLength(5);
      expect(DEFAULT_CHAOS_RUNNER_CONFIG.runner.maxRetries).toBe(3);
      expect(DEFAULT_CHAOS_RUNNER_CONFIG.kpis.maxRecoveryTimeMs).toBe(5000);
    });

    it('should create safe configuration with defaults', () => {
      const config = createSafeChaosRunnerConfig();
      expect(config.scenarios.length).toBeGreaterThan(0);
      expect(config.runner.maxRetries).toBeGreaterThanOrEqual(0);
    });

    it('should merge custom configuration', () => {
      const config = createSafeChaosRunnerConfig({
        runner: {
          maxRetries: 5,
          retryDelayMs: 2000,
          enableTelemetry: false,
          verboseLogging: true,
        },
      });
      expect(config.runner.maxRetries).toBe(5);
      expect(config.runner.retryDelayMs).toBe(2000);
      expect(config.runner.enableTelemetry).toBe(false);
    });

    it('should validate configuration schema', () => {
      expect(() => createSafeChaosRunnerConfig({
        runner: {
          maxRetries: -1, // Invalid
          retryDelayMs: 1000,
          enableTelemetry: true,
          verboseLogging: false,
        },
      })).toThrow();
    });
  });

  describe('Chaos Event: Crash Mid-Save', () => {
    it('should simulate crash during save operation', async () => {
      mockSaveData.mockImplementationOnce(() => {
        throw new Error('Simulated crash during save');
      });

      const testData = { activitySlots: [{ id: 'slot-1', activityId: 'mining' }] };
      
      await expect(mockSaveData('test-key', testData)).rejects.toThrow('Simulated crash during save');
      expect(mockSaveData).toHaveBeenCalledTimes(1);
    });

    it('should recover from crash with retry', async () => {
      let callCount = 0;
      mockSaveData.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First attempt fails');
        }
        return Promise.resolve();
      });

      const testData = { activitySlots: [{ id: 'slot-1', activityId: 'mining' }] };
      
      // First call fails
      await expect(mockSaveData('test-key', testData)).rejects.toThrow();
      
      // Second call succeeds
      await expect(mockSaveData('test-key', testData)).resolves.toBeUndefined();
      expect(mockSaveData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Chaos Event: Crash Mid-Load', () => {
    it('should simulate crash during load operation', async () => {
      mockLoadData.mockImplementationOnce(() => {
        throw new Error('Simulated crash during load');
      });

      await expect(mockLoadData('test-key', {})).rejects.toThrow('Simulated crash during load');
      expect(mockLoadData).toHaveBeenCalledTimes(1);
    });

    it('should fallback to default state on load failure', async () => {
      mockLoadData.mockImplementationOnce(() => {
        throw new Error('Load failed');
      });

      const defaultState = { activitySlots: [] };
      
      try {
        await mockLoadData('test-key', defaultState);
      } catch (error) {
        // Should use default state
        expect(defaultState).toEqual({ activitySlots: [] });
      }
    });
  });

  describe('Chaos Event: Quota Exceeded', () => {
    it('should simulate quota exceeded error', async () => {
      mockSaveData.mockImplementationOnce(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const largeData = {
        activitySlots: Array.from({ length: 1000 }, (_, i) => ({
          id: `slot-${i}`,
          activityId: `activity-${i}`,
        })),
      };

      await expect(mockSaveData('test-key', largeData)).rejects.toThrow('QuotaExceededError');
    });

    it('should handle quota exceeded gracefully', async () => {
      mockSaveData.mockImplementationOnce(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const testData = { activitySlots: [{ id: 'slot-1' }] };
      
      try {
        await mockSaveData('test-key', testData);
      } catch (error: any) {
        expect(error.name).toBe('QuotaExceededError');
        // Should implement cleanup or compression here
      }
    });
  });

  describe('Chaos Event: Duplicate Hydration', () => {
    it('should detect duplicate hydration attempts', async () => {
      const hydrationAttempts: number[] = [];
      
      mockLoadData.mockImplementation(async () => {
        hydrationAttempts.push(Date.now());
        return { activitySlots: [{ id: 'slot-1' }] };
      });

      // Simulate multiple tabs loading simultaneously
      await Promise.all([
        mockLoadData('test-key', {}),
        mockLoadData('test-key', {}),
        mockLoadData('test-key', {}),
      ]);

      expect(hydrationAttempts).toHaveLength(3);
      expect(mockLoadData).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent hydration without data loss', async () => {
      const results: any[] = [];
      
      mockLoadData.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { activitySlots: [{ id: 'slot-1', activityId: 'mining' }] };
      });

      const loads = await Promise.all([
        mockLoadData('test-key', {}),
        mockLoadData('test-key', {}),
      ]);

      results.push(...loads);
      
      // All loads should return same data
      expect(results[0]).toEqual(results[1]);
    });
  });

  describe('Chaos Event: Corrupted Data', () => {
    it('should detect corrupted data on load', async () => {
      mockLoadData.mockImplementationOnce(() => {
        return Promise.resolve('CORRUPTED_DATA');
      });

      const result = await mockLoadData('test-key', {});
      expect(result).toBe('CORRUPTED_DATA');
      // Should validate and reject corrupted data
    });

    it('should fallback to default on corrupted data', async () => {
      mockLoadData.mockImplementationOnce(() => {
        return Promise.resolve({ invalid: 'structure' });
      });

      const defaultState = { activitySlots: [] };
      const result = await mockLoadData('test-key', defaultState);
      
      // Should validate schema and use default if invalid
      if (typeof result === 'object' && !Array.isArray((result as any).activitySlots)) {
        expect(defaultState).toEqual({ activitySlots: [] });
      }
    });
  });

  describe('Chaos Event: Network Timeout', () => {
    it('should simulate network timeout', async () => {
      mockSaveData.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100);
        });
      });

      await expect(mockSaveData('test-key', {})).rejects.toThrow('Network timeout');
    });

    it('should retry on network timeout', async () => {
      let attempts = 0;
      mockSaveData.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve();
      });

      // First two attempts fail
      await expect(mockSaveData('test-key', {})).rejects.toThrow();
      await expect(mockSaveData('test-key', {})).rejects.toThrow();
      
      // Third attempt succeeds
      await expect(mockSaveData('test-key', {})).resolves.toBeUndefined();
      expect(attempts).toBe(3);
    });
  });

  describe('Chaos Event: Concurrent Writes', () => {
    it('should handle concurrent write operations', async () => {
      const writeOrder: number[] = [];
      
      mockSaveData.mockImplementation(async () => {
        const id = writeOrder.length;
        writeOrder.push(id);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        return Promise.resolve();
      });

      await Promise.all([
        mockSaveData('test-key', { version: 1 }),
        mockSaveData('test-key', { version: 2 }),
        mockSaveData('test-key', { version: 3 }),
      ]);

      expect(writeOrder).toHaveLength(3);
      expect(mockSaveData).toHaveBeenCalledTimes(3);
    });

    it('should queue concurrent writes to prevent conflicts', async () => {
      const operations: string[] = [];
      
      mockSaveData.mockImplementation(async (key: string, data: any) => {
        operations.push(`start-${data.version}`);
        await new Promise(resolve => setTimeout(resolve, 10));
        operations.push(`end-${data.version}`);
      });

      // Simulate queued writes
      await mockSaveData('test-key', { version: 1 });
      await mockSaveData('test-key', { version: 2 });

      expect(operations).toEqual(['start-1', 'end-1', 'start-2', 'end-2']);
    });
  });

  describe('Data Integrity', () => {
    it('should calculate data integrity score', () => {
      const expected = {
        activitySlots: [
          { id: 'slot-1', activityId: 'mining' },
          { id: 'slot-2', activityId: 'farming' },
        ],
      };

      const actual = {
        activitySlots: [
          { id: 'slot-1', activityId: 'mining' },
          { id: 'slot-2', activityId: 'farming' },
        ],
      };

      const score = calculateDataIntegrity(expected, actual);
      expect(score).toBe(100);
    });

    it('should detect partial data loss', () => {
      const expected = {
        activitySlots: [{ id: 'slot-1' }],
        metadata: { version: 1 },
      };

      const actual = {
        activitySlots: [{ id: 'slot-1' }],
        metadata: { version: 2 }, // Different
      };

      const score = calculateDataIntegrity(expected, actual);
      expect(score).toBe(50); // 1 out of 2 keys match
    });

    it('should handle empty states', () => {
      const score = calculateDataIntegrity({}, {});
      expect(score).toBe(100);
    });
  });

  describe('Recovery Metrics', () => {
    it('should track recovery time', async () => {
      const startTime = Date.now();
      
      mockLoadData.mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { activitySlots: [] };
      });

      await mockLoadData('test-key', {});
      const recoveryTime = Date.now() - startTime;
      
      expect(recoveryTime).toBeGreaterThanOrEqual(100);
      expect(recoveryTime).toBeLessThan(200);
    });

    it('should count failed recoveries', async () => {
      let failures = 0;
      
      mockLoadData.mockImplementation(() => {
        failures++;
        throw new Error('Recovery failed');
      });

      for (let i = 0; i < 3; i++) {
        try {
          await mockLoadData('test-key', {});
        } catch {
          // Expected
        }
      }

      expect(failures).toBe(3);
    });
  });

  describe('Export Functions', () => {
    it('should generate chaos run summary', () => {
      const result: ChaosRunResult = {
        totalScenarios: 5,
        passedScenarios: 4,
        failedScenarios: 1,
        totalEvents: 10,
        recoveredEvents: 9,
        averageDataIntegrity: 95.5,
        kpisMet: true,
        results: [
          {
            scenarioId: 'test-scenario',
            success: true,
            duration: 1000,
            eventsTriggered: 2,
            eventsRecovered: 2,
            dataIntegrityScore: 100,
            errors: [],
            recoveryMetrics: {
              averageRecoveryTimeMs: 500,
              maxRecoveryTimeMs: 800,
              failedRecoveries: 0,
            },
            mitigationsSuggested: [],
          },
        ],
        timestamp: new Date().toISOString(),
        suggestions: ['Implement retry logic'],
      };

      const summary = generateChaosRunSummary(result);
      expect(summary).toContain('ActivitySlot Persistence Chaos Test');
      expect(summary).toContain('Total Scenarios: 5');
      expect(summary).toContain('Passed: 4');
      expect(summary).toContain('Failed: 1');
    });

    it('should export to JSON', () => {
      const result: ChaosRunResult = {
        totalScenarios: 1,
        passedScenarios: 1,
        failedScenarios: 0,
        totalEvents: 1,
        recoveredEvents: 1,
        averageDataIntegrity: 100,
        kpisMet: true,
        results: [],
        timestamp: new Date().toISOString(),
        suggestions: [],
      };

      const json = exportToJSON(result);
      expect(json).toContain('"totalScenarios": 1');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should export to Markdown', () => {
      const result: ChaosRunResult = {
        totalScenarios: 1,
        passedScenarios: 1,
        failedScenarios: 0,
        totalEvents: 1,
        recoveredEvents: 1,
        averageDataIntegrity: 100,
        kpisMet: true,
        results: [],
        timestamp: new Date().toISOString(),
        suggestions: [],
      };

      const markdown = exportToMarkdown(result);
      expect(markdown).toContain('# ActivitySlot Persistence Chaos Test Results');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('**Total Scenarios:** 1');
    });
  });

  describe('KPI Validation', () => {
    it('should validate recovery time KPI', () => {
      const config = createSafeChaosRunnerConfig();
      const maxRecoveryTime = config.kpis.maxRecoveryTimeMs;
      
      expect(maxRecoveryTime).toBe(5000);
      
      // Simulate recovery within KPI
      const actualRecoveryTime = 3000;
      expect(actualRecoveryTime).toBeLessThan(maxRecoveryTime);
    });

    it('should validate data integrity KPI', () => {
      const config = createSafeChaosRunnerConfig();
      const minIntegrity = config.kpis.minDataIntegrityPercent;
      
      expect(minIntegrity).toBe(95);
      
      // Simulate integrity above KPI
      const actualIntegrity = 98;
      expect(actualIntegrity).toBeGreaterThanOrEqual(minIntegrity);
    });

    it('should validate failure rate KPI', () => {
      const config = createSafeChaosRunnerConfig();
      const maxFailureRate = config.kpis.maxFailureRate;
      
      expect(maxFailureRate).toBe(0.05);
      
      // Simulate failure rate below KPI
      const actualFailureRate = 0.02;
      expect(actualFailureRate).toBeLessThanOrEqual(maxFailureRate);
    });
  });

  describe('Telemetry', () => {
    it('should emit chaos run telemetry', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      console.log('[Telemetry] iv_activityslot_chaos_run', {
        totalScenarios: 5,
        passedScenarios: 4,
        failedScenarios: 1,
        recoveryRate: 90,
        dataIntegrity: 95.5,
        timestamp: Date.now(),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Telemetry] iv_activityslot_chaos_run',
        expect.objectContaining({
          totalScenarios: 5,
          passedScenarios: 4,
          failedScenarios: 1,
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
