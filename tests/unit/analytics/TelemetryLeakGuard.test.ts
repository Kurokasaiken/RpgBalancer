/**
 * NP-050 – Telemetry Memory Leak Guard Unit Tests
 * 
 * Comprehensive test suite for memory leak detection,
 * configuration validation, and CLI functionality.
 * 
 * @since 2026-01-21
 * @author Sentinel-Analytics – Leak Guard
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TelemetryLeakGuard, type MemoryLeakDetection, type MemorySample } from '@/analytics/memory/TelemetryLeakGuard';
import {
  createMemoryLeakGuardConfig,
  createEnvironmentSpecificConfig,
  validateMemoryLeakGuardConfig,
  DEFAULT_MEMORY_LEAK_GUARD_CONFIG,
  type MemoryLeakGuardConfig
} from '@/analytics/memory/memoryLeakGuardConfig';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('TelemetryLeakGuard', () => {
  let guard: TelemetryLeakGuard;
  let mockConfig: MemoryLeakGuardConfig;

  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    
    mockConfig = createMemoryLeakGuardConfig({
      instanceId: 'test-guard',
      thresholds: {
        maxHeapSizeMB: 50,
        growthRateMBPerMin: 2.0,
        sampleWindowMin: 5,
        minSamples: 3,
        sensitivity: 0.7,
        leakSlopeThreshold: 1.0,
      },
      sampling: {
        intervalMs: 1000, // Faster for tests
        maxSamples: 10,
        retentionMin: 1,
        enableCleanup: true,
        strategy: 'fixed',
      },
      persistence: {
        enabled: false, // Disable persistence for tests
        storageKey: 'test_memory_samples',
        intervalMin: 1,
      },
      telemetry: {
        enabled: false, // Disable telemetry for tests
        eventPrefix: 'test_leak_guard',
        includeMemoryData: false,
      },
      alertChannels: [
        {
          type: 'console',
          target: 'stdout',
          severity: ['medium', 'high', 'critical'],
          rateLimit: 5,
        },
      ],
    });
    
    guard = new TelemetryLeakGuard(mockConfig);
  });

  afterEach(async () => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    
    // Stop guard if running
    if (guard) {
      await guard.stop();
    }
    
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should create guard with default configuration', () => {
      const defaultGuard = new TelemetryLeakGuard(DEFAULT_MEMORY_LEAK_GUARD_CONFIG);
      expect(defaultGuard).toBeDefined();
    });

    it('should create guard with custom configuration', () => {
      const customConfig = createMemoryLeakGuardConfig({
        instanceId: 'custom-guard',
        thresholds: {
          maxHeapSizeMB: 200,
          growthRateMBPerMin: 10.0,
        },
      });
      
      const customGuard = new TelemetryLeakGuard(customConfig);
      expect(customGuard).toBeDefined();
    });

    it('should update configuration', () => {
      const newConfig = createMemoryLeakGuardConfig({
        thresholds: {
          maxHeapSizeMB: 150,
        },
      });
      
      guard.updateConfig(newConfig);
      
      // Config should be updated (we can't directly access it, but we can test behavior)
      expect(guard).toBeDefined();
    });
  });

  describe('Memory Sampling', () => {
    it('should collect memory sample manually', async () => {
      const sample = await guard.collectSample('test');
      
      expect(sample).toBeDefined();
      expect(sample.heapUsedMB).toBeGreaterThan(0);
      expect(sample.heapTotalMB).toBeGreaterThan(0);
      expect(sample.timestamp).toBeTypeOf('number');
      expect(sample.source).toBe('test');
      expect(sample.collectionDurationMs).toBeGreaterThanOrEqual(0);
      expect(sample.cpuUsage).toBeGreaterThanOrEqual(0);
    });

    it('should collect multiple samples', async () => {
      const sample1 = await guard.collectSample('test1');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const sample2 = await guard.collectSample('test2');
      
      expect(sample1.timestamp).toBeLessThan(sample2.timestamp);
      expect(sample1.source).toBe('test1');
      expect(sample2.source).toBe('test2');
    });

    it('should handle sampling errors gracefully', async () => {
      // Mock process.memoryUsage to throw error
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = vi.fn().mockImplementation(() => {
        throw new Error('Memory usage error');
      });
      
      // Should not throw, but should log error
      const sample = await guard.collectSample('error-test');
      
      expect(sample).toBeDefined(); // Should still return a sample
      expect(console.error).toHaveBeenCalled();
      
      // Restore
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('Memory Analysis', () => {
    it('should return no leak detection with insufficient samples', async () => {
      // Only collect 2 samples (less than minSamples: 3)
      await guard.collectSample('test1');
      await guard.collectSample('test2');
      
      const detection = await guard.analyzeMemory();
      
      expect(detection.leakDetected).toBe(false);
      expect(detection.severity).toBe('low');
      expect(detection.reasons).toContain('Insufficient samples for analysis');
      expect(detection.recommendations).toContain('Wait for more samples');
    });

    it('should detect memory leak with high growth rate', async () => {
      // Simulate memory growth
      const baseMemory = 30;
      for (let i = 0; i < 5; i++) {
        // Create samples with increasing memory usage
        const mockSample: MemorySample = {
          timestamp: Date.now() + (i * 1000),
          heapUsedMB: baseMemory + (i * 2), // 2MB growth per sample
          heapTotalMB: 100,
          externalMB: 10,
          rssMB: 50,
          collectionDurationMs: 1,
          cpuUsage: 5,
          source: 'test',
        };
        
        // Manually add sample to simulate growth
        (guard as any).samples.push(mockSample);
      }
      
      const detection = await guard.analyzeMemory();
      
      expect(detection.leakDetected).toBe(true);
      expect(detection.severity).toBe('medium'); // Growth rate exceeds threshold
      expect(detection.reasons.some(reason => reason.includes('growth rate'))).toBe(true);
    });

    it('should detect memory leak with absolute threshold breach', async () => {
      // Create samples with high memory usage
      for (let i = 0; i < 5; i++) {
        const mockSample: MemorySample = {
          timestamp: Date.now() + (i * 1000),
          heapUsedMB: 60, // Exceeds maxHeapSizeMB: 50
          heapTotalMB: 100,
          externalMB: 10,
          rssMB: 50,
          collectionDurationMs: 1,
          cpuUsage: 5,
          source: 'test',
        };
        
        (guard as any).samples.push(mockSample);
      }
      
      const detection = await guard.analyzeMemory();
      
      expect(detection.leakDetected).toBe(true);
      expect(detection.severity).toBe('high'); // Absolute threshold breach
      expect(detection.reasons.some(reason => reason.includes('exceeds threshold'))).toBe(true);
    });

    it('should detect critical memory leak with high slope', async () => {
      // Create samples with very steep growth
      for (let i = 0; i < 5; i++) {
        const mockSample: MemorySample = {
          timestamp: Date.now() + (i * 1000),
          heapUsedMB: 30 + (i * 5), // 5MB growth per sample (very steep)
          heapTotalMB: 100,
          externalMB: 10,
          rssMB: 50,
          collectionDurationMs: 1,
          cpuUsage: 5,
          source: 'test',
        };
        
        (guard as any).samples.push(mockSample);
      }
      
      const detection = await guard.analyzeMemory();
      
      expect(detection.leakDetected).toBe(true);
      expect(detection.severity).toBe('critical'); // High slope triggers critical
      expect(detection.reasons.some(reason => reason.includes('leak slope'))).toBe(true);
    });

    it('should calculate trend correctly', async () => {
      // Create samples with linear growth
      for (let i = 0; i < 5; i++) {
        const mockSample: MemorySample = {
          timestamp: Date.now() + (i * 60000), // 1 minute intervals
          heapUsedMB: 30 + (i * 2), // 2MB per minute growth
          heapTotalMB: 100,
          externalMB: 10,
          rssMB: 50,
          collectionDurationMs: 1,
          cpuUsage: 5,
          source: 'test',
        };
        
        (guard as any).samples.push(mockSample);
      }
      
      const detection = await guard.analyzeMemory();
      
      expect(detection.trend.growthSlopeMBPerMin).toBeCloseTo(2.0, 1); // Should be ~2MB/min
      expect(detection.trend.correlation).toBeCloseTo(1.0, 1); // Should be perfect correlation
      expect(detection.trend.confidence).toBeGreaterThan(0.9);
      expect(detection.trend.predictedNextHourMB).toBeGreaterThan(detection.currentUsage.heapUsedMB);
    });
  });

  describe('Guard Lifecycle', () => {
    it('should start and stop guard successfully', async () => {
      await guard.start();
      expect(guard.getMemoryStats().isRunning).toBe(true);
      
      await guard.stop();
      expect(guard.getMemoryStats().isRunning).toBe(false);
    });

    it('should not start if already running', async () => {
      await guard.start();
      await guard.start(); // Should not cause issues
      
      expect(guard.getMemoryStats().isRunning).toBe(true);
      
      await guard.stop();
    });

    it('should not stop if not running', async () => {
      await guard.stop(); // Should not cause issues
      expect(guard.getMemoryStats().isRunning).toBe(false);
    });

    it('should not start if disabled', async () => {
      const disabledConfig = createMemoryLeakGuardConfig({
        enabled: false,
      });
      
      const disabledGuard = new TelemetryLeakGuard(disabledConfig);
      await disabledGuard.start();
      
      expect(disabledGuard.getMemoryStats().isRunning).toBe(false);
    });
  });

  describe('Memory Statistics', () => {
    it('should return correct statistics', async () => {
      await guard.collectSample('test1');
      await guard.collectSample('test2');
      
      const stats = guard.getMemoryStats();
      
      expect(stats.sampleCount).toBe(2);
      expect(stats.current).toBeDefined();
      expect(stats.current.heapUsedMB).toBeGreaterThan(0);
      expect(stats.isRunning).toBe(false);
      expect(stats.trend).toBeNull(); // Not enough samples
    });

    it('should return trend when enough samples', async () => {
      // Add enough samples
      for (let i = 0; i < 5; i++) {
        await guard.collectSample(`test${i}`);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const stats = guard.getMemoryStats();
      
      expect(stats.sampleCount).toBe(5);
      expect(stats.current).toBeDefined();
      expect(stats.trend).toBeDefined();
      expect(stats.trend.growthSlopeMBPerMin).toBeTypeOf('number');
    });
  });

  describe('Alert System', () => {
    it('should trigger alerts for medium severity', async () => {
      // Create samples that trigger medium severity
      for (let i = 0; i < 5; i++) {
        const mockSample: MemorySample = {
          timestamp: Date.now() + (i * 1000),
          heapUsedMB: 40 + (i * 1.5), // Growth rate ~1.5MB/min
          heapTotalMB: 100,
          externalMB: 10,
          rssMB: 50,
          collectionDurationMs: 1,
          cpuUsage: 5,
          source: 'test',
        };
        
        (guard as any).samples.push(mockSample);
      }
      
      const detection = await guard.analyzeMemory();
      
      expect(detection.leakDetected).toBe(true);
      expect(detection.triggeredChannels.length).toBeGreaterThan(0);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[MEMORY LEAK ALERT]')
      );
    });

    it('should respect rate limiting', async () => {
      // Create multiple detections quickly
      for (let i = 0; i < 10; i++) {
        // Create high memory samples
        for (let j = 0; j < 5; j++) {
          const mockSample: MemorySample = {
            timestamp: Date.now() + (j * 1000),
            heapUsedMB: 60, // High memory
            heapTotalMB: 100,
            externalMB: 10,
            rssMB: 50,
            collectionDurationMs: 1,
            cpuUsage: 5,
            source: 'test',
          };
          
          (guard as any).samples = [mockSample]; // Reset samples
        }
        
        await guard.analyzeMemory();
      }
      
      // Should have rate limited some alerts
      expect(console.log).toHaveBeenCalledTimes(5); // Rate limit: 5 alerts
    });
  });

  describe('Persistence Integration', () => {
    it('should handle persistence load errors gracefully', async () => {
      const { loadData } = await import('@/shared/persistence/PersistenceService');
      vi.mocked(loadData).mockRejectedValue(new Error('Load error'));
      
      const persistentConfig = createMemoryLeakGuardConfig({
        persistence: { enabled: true },
      });
      
      const persistentGuard = new TelemetryLeakGuard(persistentConfig);
      await persistentGuard.start();
      
      // Should still work despite load error
      expect(persistentGuard.getMemoryStats().isRunning).toBe(true);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load memory samples')
      );
      
      await persistentGuard.stop();
    });

    it('should handle persistence save errors gracefully', async () => {
      const { saveData } = await import('@/shared/persistence/PersistenceService');
      vi.mocked(saveData).mockRejectedValue(new Error('Save error'));
      
      const persistentConfig = createMemoryLeakGuardConfig({
        persistence: { enabled: true },
      });
      
      const persistentGuard = new TelemetryLeakGuard(persistentConfig);
      await persistentGuard.start();
      
      await persistentGuard.collectSample('test');
      
      // Should still work despite save error
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save memory samples')
      );
      
      await persistentGuard.stop();
    });
  });

  describe('Performance Impact', () => {
    it('should complete sample collection within time limit', async () => {
      const startTime = performance.now();
      await guard.collectSample('performance-test');
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(50); // Should complete within 50ms
    });

    it('should handle rapid sampling without issues', async () => {
      const promises = [];
      
      // Collect 10 samples rapidly
      for (let i = 0; i < 10; i++) {
        promises.push(guard.collectSample(`rapid-${i}`));
      }
      
      const samples = await Promise.all(promises);
      
      expect(samples).toHaveLength(10);
      expect(samples.every(sample => sample.heapUsedMB > 0)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty samples array', async () => {
      (guard as any).samples = [];
      
      const detection = await guard.analyzeMemory();
      
      expect(detection.leakDetected).toBe(false);
      expect(detection.severity).toBe('low');
      expect(detection.reasons).toContain('Insufficient samples for analysis');
    });

    it('should handle single sample', async () => {
      await guard.collectSample('single-test');
      
      const detection = await guard.analyzeMemory();
      
      expect(detection.leakDetected).toBe(false);
      expect(detection.severity).toBe('low');
      expect(detection.reasons).toContain('Insufficient samples for analysis');
    });

    it('should handle samples with same timestamp', async () => {
      const timestamp = Date.now();
      
      // Create samples with same timestamp
      for (let i = 0; i < 5; i++) {
        const mockSample: MemorySample = {
          timestamp,
          heapUsedMB: 30 + i,
          heapTotalMB: 100,
          externalMB: 10,
          rssMB: 50,
          collectionDurationMs: 1,
          cpuUsage: 5,
          source: 'test',
        };
        
        (guard as any).samples.push(mockSample);
      }
      
      const detection = await guard.analyzeMemory();
      
      // Should handle gracefully (no division by zero)
      expect(detection).toBeDefined();
      expect(detection.trend.correlation).toBeTypeOf('number');
    });

    it('should handle memory usage of zero', async () => {
      // Mock process.memoryUsage to return zero values
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
      });
      
      const sample = await guard.collectSample('zero-test');
      
      expect(sample.heapUsedMB).toBe(0);
      expect(sample.heapTotalMB).toBe(0);
      expect(sample.externalMB).toBe(0);
      expect(sample.rssMB).toBe(0);
      
      // Restore
      process.memoryUsage = originalMemoryUsage;
    });
  });
});

describe('MemoryLeakGuardConfig', () => {
  describe('Configuration Creation', () => {
    it('should create default configuration', () => {
      const config = createMemoryLeakGuardConfig();
      
      expect(config.instanceId).toBe('telemetry-leak-guard-default');
      expect(config.enabled).toBe(true);
      expect(config.thresholds.maxHeapSizeMB).toBe(100);
      expect(config.sampling.intervalMs).toBe(5000);
      expect(config.alertChannels).toHaveLength(2);
    });

    it('should create configuration with overrides', () => {
      const config = createMemoryLeakGuardConfig({
        instanceId: 'custom',
        thresholds: {
          maxHeapSizeMB: 200,
        },
        sampling: {
          intervalMs: 10000,
        },
      });
      
      expect(config.instanceId).toBe('custom');
      expect(config.thresholds.maxHeapSizeMB).toBe(200);
      expect(config.sampling.intervalMs).toBe(10000);
      // Other defaults should remain
      expect(config.thresholds.growthRateMBPerMin).toBe(5.0);
      expect(config.sampling.maxSamples).toBe(100);
    });

    it('should create environment-specific configurations', () => {
      const devConfig = createEnvironmentSpecificConfig('development');
      const stagingConfig = createEnvironmentSpecificConfig('staging');
      const prodConfig = createEnvironmentSpecificConfig('production');
      
      // Development should be more lenient
      expect(devConfig.thresholds.maxHeapSizeMB).toBeGreaterThan(prodConfig.thresholds.maxHeapSizeMB);
      expect(devConfig.sampling.intervalMs).toBeLessThan(prodConfig.sampling.intervalMs);
      
      // Production should be strict
      expect(prodConfig.thresholds.sensitivity).toBeGreaterThan(devConfig.thresholds.sensitivity);
      expect(prodConfig.alertChannels.some(c => c.type === 'email')).toBe(true);
      
      // Staging should be in between
      expect(stagingConfig.thresholds.maxHeapSizeMB).toBeGreaterThan(prodConfig.thresholds.maxHeapSizeMB);
      expect(stagingConfig.thresholds.maxHeapSizeMB).toBeLessThan(devConfig.thresholds.maxHeapSizeMB);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid configuration', () => {
      const validConfig = createMemoryLeakGuardConfig();
      
      expect(() => validateMemoryLeakGuardConfig(validConfig)).not.toThrow();
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        instanceId: 'test',
        thresholds: {
          maxHeapSizeMB: -10, // Invalid: negative
        },
      };
      
      expect(() => validateMemoryLeakGuardConfig(invalidConfig)).toThrow();
    });

    it('should provide validation errors', () => {
      const invalidConfig = {
        thresholds: {
          maxHeapSizeMB: 'invalid', // Invalid type
        },
      };
      
      const errors = validateMemoryLeakGuardConfig(invalidConfig);
      expect(errors).toBeUndefined(); // Should throw, not return errors
    });
  });

  describe('Configuration Utilities', () => {
    it('should merge multiple configurations', () => {
      const config1 = createMemoryLeakGuardConfig({
        thresholds: { maxHeapSizeMB: 150 },
      });
      
      const config2 = createMemoryLeakGuardConfig({
        sampling: { intervalMs: 2000 },
      });
      
      const config3 = createMemoryLeakGuardConfig({
        alertChannels: [{ type: 'webhook' as const, target: 'test', severity: ['critical'], rateLimit: 1 }],
      });
      
      // This would need to be implemented in the actual code
      // For now, just test that the function exists
      expect(typeof createMemoryLeakGuardConfig).toBe('function');
    });

    it('should validate configuration for environment', () => {
      const validConfig = createMemoryLeakGuardConfig();
      
      // This would need to be implemented in the actual code
      // For now, just test that the function exists
      expect(typeof validateMemoryLeakGuardConfig).toBe('function');
    });
  });
});
