import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { IdleVillageDragHarness, runDragStressTest } from '@/tests/utils/idleVillageDragHarness';
import type { DragStressConfig } from '@/ui/idleVillage/config/dragStressConfig';
import { DEFAULT_DRAG_STRESS_CONFIG } from '@/ui/idleVillage/config/dragStressConfig';

// Setup DOM environment for stress testing
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

global.window = dom.window as any;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.DragEvent = dom.window.DragEvent;
global.DataTransfer = dom.window.DataTransfer;
global.performance = dom.window.performance;

describe('ResidentDragStress', () => {
  let harness: IdleVillageDragHarness;

  beforeEach(() => {
    // Reset DOM before each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (harness) {
      harness.cleanup();
    }
  });

  describe('Basic Stress Test Functionality', () => {
    it('should create harness with default config', () => {
      harness = new IdleVillageDragHarness();
      expect(harness).toBeDefined();
    });

    it('should create harness with custom config', () => {
      const customConfig: Partial<DragStressConfig> = {
        batchSize: 10,
        operationsPerBatch: 50,
        cooldownMs: 10,
      };
      
      harness = new IdleVillageDragHarness(customConfig);
      expect(harness).toBeDefined();
    });

    it('should generate test residents', () => {
      harness = new IdleVillageDragHarness();
      const residents = harness['generateTestResidents'](5);
      
      expect(residents).toHaveLength(5);
      expect(residents[0]).toMatch(/^stress-resident-\d+$/);
    });

    it('should execute a minimal stress test', async () => {
      const config: Partial<DragStressConfig> = {
        batchSize: 2,
        operationsPerBatch: 10,
        cooldownMs: 0,
        mockTimers: false, // Use real timers for this test
      };

      harness = new IdleVillageDragHarness(config);
      const metrics = await harness.executeStressTest();

      expect(metrics).toBeDefined();
      expect(metrics.length).toBeGreaterThan(0);
      
      const stats = harness.calculateStatistics();
      expect(stats.totalOperations).toBeGreaterThan(0);
      expect(stats.averageLatency).toBeGreaterThanOrEqual(0);
      expect(stats.errorRate).toBeGreaterThanOrEqual(0);
    }, 10000);

    it('should respect performance thresholds', async () => {
      const config: Partial<DragStressConfig> = {
        batchSize: 1,
        operationsPerBatch: 5,
        cooldownMs: 0,
        performanceThresholds: {
          maxTTI: 1000,
          maxDropLatency: 50,
          maxMemoryGrowth: 50,
          maxCPUUsage: 90,
        },
        mockTimers: false,
      };

      harness = new IdleVillageDragHarness(config);
      
      // Should complete without throwing threshold errors
      await expect(harness.executeStressTest()).resolves.toBeDefined();
    }, 5000);
  });

  describe('Performance Monitoring', () => {
    it('should collect performance metrics', async () => {
      const config: Partial<DragStressConfig> = {
        batchSize: 1,
        operationsPerBatch: 20,
        cooldownMs: 0,
        mockTimers: false,
      };

      harness = new IdleVillageDragHarness(config);
      await harness.executeStressTest();

      const stats = harness.calculateStatistics();
      
      expect(stats.totalOperations).toBe(20);
      expect(stats.averageLatency).toBeGreaterThan(0);
      expect(stats.throughput).toBeGreaterThan(0);
    }, 5000);

    it('should export metrics to CSV', async () => {
      const config: Partial<DragStressConfig> = {
        batchSize: 1,
        operationsPerBatch: 5,
        cooldownMs: 0,
        mockTimers: false,
      };

      harness = new IdleVillageDragHarness(config);
      await harness.executeStressTest();

      const csv = harness.exportToCSV();
      
      expect(csv).toContain('batchIndex,operationIndex,operationType,timestamp,duration');
      expect(csv).toContain('drag_start');
      expect(csv).toContain('drag_over');
      expect(csv).toContain('drop');
    }, 5000);
  });

  describe('Error Handling', () => {
    it('should handle memory threshold exceeded', async () => {
      const config: Partial<DragStressConfig> = {
        batchSize: 1,
        operationsPerBatch: 10,
        cooldownMs: 0,
        performanceThresholds: {
          maxTTI: 1000,
          maxDropLatency: 100,
          maxMemoryGrowth: 0.001, // Very low threshold to trigger error
          maxCPUUsage: 90,
        },
        mockTimers: false,
      };

      harness = new IdleVillageDragHarness(config);
      
      // Should throw memory threshold error
      await expect(harness.executeStressTest()).rejects.toThrow(/Memory threshold exceeded/);
    }, 5000);

    it('should handle latency threshold exceeded', async () => {
      const config: Partial<DragStressConfig> = {
        batchSize: 1,
        operationsPerBatch: 10,
        cooldownMs: 0,
        performanceThresholds: {
          maxTTI: 1000,
          maxDropLatency: 0.001, // Very low threshold to trigger error
          maxMemoryGrowth: 100,
          maxCPUUsage: 90,
        },
        mockTimers: false,
      };

      harness = new IdleVillageDragHarness(config);
      
      // Should throw latency threshold error
      await expect(harness.executeStressTest()).rejects.toThrow(/Latency threshold exceeded/);
    }, 5000);
  });

  describe('Utility Function', () => {
    it('should run stress test with utility function', async () => {
      const config: Partial<DragStressConfig> = {
        batchSize: 1,
        operationsPerBatch: 5,
        cooldownMs: 0,
        mockTimers: false,
      };

      const result = await runDragStressTest(config);

      expect(result.metrics).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.csvReport).toBeDefined();
      
      expect(result.statistics.totalOperations).toBe(5);
      expect(result.csvReport).toContain('drag_start');
    }, 5000);

    it('should cleanup resources automatically', async () => {
      const config: Partial<DragStressConfig> = {
        batchSize: 1,
        operationsPerBatch: 3,
        cooldownMs: 0,
        mockTimers: false,
      };

      // Utility function should handle cleanup automatically
      const result = await runDragStressTest(config);
      expect(result).toBeDefined();
    }, 5000);
  });

  describe('Configuration Validation', () => {
    it('should accept valid configurations', () => {
      const validConfigs: Partial<DragStressConfig>[] = [
        { batchSize: 10 },
        { operationsPerBatch: 100 },
        { cooldownMs: 50 },
        { maxConcurrentDrags: 3 },
        { enableTelemetry: false },
        { mockTimers: true },
        { virtualizationThreshold: 25 },
        {
          performanceThresholds: {
            maxTTI: 2000,
            maxDropLatency: 150,
            maxMemoryGrowth: 200,
            maxCPUUsage: 85,
          },
        },
      ];

      validConfigs.forEach((config) => {
        expect(() => new IdleVillageDragHarness(config)).not.toThrow();
      });
    });

    it('should use default config for missing values', () => {
      const harness = new IdleVillageDragHarness({});
      const config = harness['config'];
      
      expect(config.batchSize).toBe(DEFAULT_DRAG_STRESS_CONFIG.batchSize);
      expect(config.operationsPerBatch).toBe(DEFAULT_DRAG_STRESS_CONFIG.operationsPerBatch);
      expect(config.cooldownMs).toBe(DEFAULT_DRAG_STRESS_CONFIG.cooldownMs);
    });
  });

  describe('TTI Measurement', () => {
    it('should measure Time to Interactive', async () => {
      const config: Partial<DragStressConfig> = {
        batchSize: 1,
        operationsPerBatch: 10,
        cooldownMs: 0,
        mockTimers: false,
      };

      const startTime = performance.now();
      harness = new IdleVillageDragHarness(config);
      await harness.executeStressTest();
      const endTime = performance.now();

      const tti = endTime - startTime;
      
      // TTI should be reasonable for small test
      expect(tti).toBeLessThan(config.performanceThresholds?.maxTTI || 3000);
    }, 5000);
  });

  describe('Telemetry Events', () => {
    it('should record telemetry when enabled', async () => {
      const config: Partial<DragStressConfig> = {
        batchSize: 1,
        operationsPerBatch: 5,
        cooldownMs: 0,
        enableTelemetry: true,
        mockTimers: false,
      };

      harness = new IdleVillageDragHarness(config);
      await harness.executeStressTest();

      const metrics = harness['metrics'];
      
      // Should have recorded telemetry events
      expect(metrics.length).toBeGreaterThan(0);
      
      // Should have different operation types
      const operationTypes = new Set(metrics.map(m => m.operationType));
      expect(operationTypes.has('drag_start')).toBe(true);
      expect(operationTypes.has('drag_over')).toBe(true);
      expect(operationTypes.has('drop')).toBe(true);
    }, 5000);
  });
});
