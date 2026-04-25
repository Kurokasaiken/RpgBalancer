import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type {
  MemoryLeakGuardConfig,
  MemorySnapshot,
  MemoryTrend,
  MemoryLeakDetection,
} from '@/analytics/memory/memoryLeakGuard';
import {
  MemoryLeakGuard,
  createMemoryLeakGuard,
  defaultMemoryLeakGuard,
} from '@/analytics/memory/memoryLeakGuard';

// Mock process.memoryUsage
const mockMemoryUsage = vi.fn();
vi.mock('process', () => ({
  pid: 12345,
  version: 'v18.0.0',
  platform: 'linux',
  arch: 'x64',
  memoryUsage: mockMemoryUsage,
}));

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  observe: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn();
vi.mock('perf_hooks', () => ({
  PerformanceObserver: mockPerformanceObserver,
  performance: mockPerformance,
}));

// Mock telemetry
const mockTrackTelemetryEvent = vi.fn();
vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: mockTrackTelemetryEvent,
}));

describe('MemoryLeakGuard', () => {
  let guard: MemoryLeakGuard;
  let mockConfig: MemoryLeakGuardConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock memory usage
    mockMemoryUsage.mockReturnValue({
      rss: 1024 * 1024 * 100, // 100MB
      heapUsed: 1024 * 1024 * 50, // 50MB
      heapTotal: 1024 * 1024 * 80, // 80MB
      external: 1024 * 1024 * 10, // 10MB
      arrayBuffers: 1024 * 1024 * 5, // 5MB
    });

    mockConfig = {
      thresholdMB: 100,
      samplingIntervalMs: 1000,
      trendDurationMs: 30000,
      maxSamples: 50,
      growthRateThreshold: 0.5,
      enableBaseline: true,
      baselineDurationMs: 10000,
      alertCooldownMs: 60000,
      verbose: false,
      storageKey: 'test-memory-leak-guard',
    };

    guard = createMemoryLeakGuard(mockConfig);
  });

  afterEach(() => {
    guard.stop();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create guard with default configuration', () => {
      const defaultGuard = createMemoryLeakGuard();
      const state = defaultGuard.getState();
      
      expect(state.config.thresholdMB).toBe(100);
      expect(state.config.samplingIntervalMs).toBe(5000);
      expect(state.config.verbose).toBe(false);
      expect(state.active).toBe(false);
    });

    it('should create guard with custom configuration', () => {
      const customGuard = createMemoryLeakGuard({
        thresholdMB: 200,
        samplingIntervalMs: 2000,
        verbose: true,
      });
      
      const state = customGuard.getState();
      expect(state.config.thresholdMB).toBe(200);
      expect(state.config.samplingIntervalMs).toBe(2000);
      expect(state.config.verbose).toBe(true);
    });

    it('should start in inactive state', () => {
      const state = guard.getState();
      expect(state.active).toBe(false);
      expect(state.snapshots).toEqual([]);
      expect(state.baseline).toBeNull();
      expect(state.totalSamples).toBe(0);
    });
  });

  describe('Memory Monitoring', () => {
    it('should start and stop monitoring', () => {
      guard.start();
      expect(guard.getState().active).toBe(true);
      
      guard.stop();
      expect(guard.getState().active).toBe(false);
    });

    it('should collect memory snapshots', async () => {
      guard.start();
      
      // Wait for at least one sample
      await new Promise(resolve => setTimeout(resolve, mockConfig.samplingIntervalMs + 100));
      
      const state = guard.getState();
      expect(state.totalSamples).toBeGreaterThan(0);
      expect(state.snapshots.length).toBeGreaterThan(0);
      
      const snapshot = guard.getCurrentSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot!.memoryMB).toBe(100);
      expect(snapshot!.heapSizeMB).toBe(50);
      expect(snapshot!.pid).toBe(12345);
    });

    it('should maintain maximum sample count', async () => {
      const smallConfig = { ...mockConfig, maxSamples: 3, samplingIntervalMs: 100 };
      const smallGuard = createMemoryLeakGuard(smallConfig);
      
      smallGuard.start();
      
      // Wait for more samples than max
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const state = smallGuard.getState();
      expect(state.snapshots.length).toBeLessThanOrEqual(3);
      
      smallGuard.stop();
    });

    it('should establish baseline after duration', async () => {
      const shortConfig = { ...mockConfig, baselineDurationMs: 200, samplingIntervalMs: 50 };
      const shortGuard = createMemoryLeakGuard(shortConfig);
      
      shortGuard.start();
      
      // Wait for baseline establishment
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const state = shortGuard.getState();
      expect(state.baseline).toBeDefined();
      expect(state.baseline!.memoryMB).toBeGreaterThan(0);
      
      shortGuard.stop();
    });
  });

  describe('Memory Trend Analysis', () => {
    it('should return null trend when no baseline exists', () => {
      const trend = guard.getTrendAnalysis();
      expect(trend).toBeNull();
    });

    it('should calculate trend when baseline exists', async () => {
      const shortConfig = { ...mockConfig, baselineDurationMs: 100, samplingIntervalMs: 50 };
      const shortGuard = createMemoryLeakGuard(shortConfig);
      
      shortGuard.start();
      
      // Wait for baseline establishment
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const trend = shortGuard.getTrendAnalysis();
      expect(trend).toBeDefined();
      expect(trend!.baseline.memoryMB).toBeGreaterThan(0);
      expect(trend!.current.memoryMB).toBeGreaterThan(0);
      expect(trend!.growthRate).toBeDefined();
      expect(trend!.direction).toBeDefined();
      
      shortGuard.stop();
    });

    it('should detect increasing trend', async () => {
      const shortConfig = { ...mockConfig, baselineDurationMs: 100, samplingIntervalMs: 50 };
      const shortGuard = createMemoryLeakGuard(shortConfig);
      
      shortGuard.start();
      
      // Wait for baseline establishment
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Simulate memory growth
      mockMemoryUsage.mockReturnValue({
        rss: 1024 * 1024 * 120, // 120MB (20MB increase)
        heapUsed: 1024 * 1024 * 60, // 60MB
        heapTotal: 1024 * 1024 * 80,
        external: 1024 * 1024 * 10,
        arrayBuffers: 1024 * 1024 * 5,
      });
      
      // Wait for new sample
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const trend = shortGuard.getTrendAnalysis();
      expect(trend!.direction).toBe('increasing');
      expect(trend!.growthRate).toBeGreaterThan(0);
      
      shortGuard.stop();
    });

    it('should detect decreasing trend', async () => {
      const shortConfig = { ...mockConfig, baselineDurationMs: 100, samplingIntervalMs: 50 };
      const shortGuard = createMemoryLeakGuard(shortConfig);
      
      shortGuard.start();
      
      // Wait for baseline establishment
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Simulate memory decrease
      mockMemoryUsage.mockReturnValue({
        rss: 1024 * 1024 * 80, // 80MB (20MB decrease)
        heapUsed: 1024 * 1024 * 40, // 40MB
        heapTotal: 1024 * 1024 * 80,
        external: 1024 * 1024 * 10,
        arrayBuffers: 1024 * 1024 * 5,
      });
      
      // Wait for new sample
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const trend = shortGuard.getTrendAnalysis();
      expect(trend!.direction).toBe('decreasing');
      expect(trend!.growthRate).toBeLessThan(0);
      
      shortGuard.stop();
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not detect leak with insufficient data', () => {
      const detection = guard.getState().lastDetection;
      expect(detection).toBeNull();
    });

    it('should detect leak when memory exceeds threshold', async () => {
      const lowThresholdConfig = { ...mockConfig, thresholdMB: 50, baselineDurationMs: 100, samplingIntervalMs: 50 };
      const lowGuard = createMemoryLeakGuard(lowThresholdConfig);
      
      lowGuard.start();
      
      // Wait for baseline establishment
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Simulate memory exceeding threshold
      mockMemoryUsage.mockReturnValue({
        rss: 1024 * 1024 * 150, // 150MB (exceeds 50MB threshold)
        heapUsed: 1024 * 1024 * 75,
        heapTotal: 1024 * 1024 * 80,
        external: 1024 * 1024 * 10,
        arrayBuffers: 1024 * 1024 * 5,
      });
      
      // Wait for new sample and detection
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const state = lowGuard.getState();
      expect(state.lastDetection).toBeDefined();
      expect(state.lastDetection!.detected).toBe(true);
      expect(state.lastDetection!.alertLevel).toBe('critical');
      expect(state.lastDetection!.reason).toContain('exceeds threshold');
      
      lowGuard.stop();
    });

    it('should detect leak when growth rate exceeds threshold', async () => {
      const lowGrowthConfig = { ...mockConfig, growthRateThreshold: 0.1, baselineDurationMs: 100, samplingIntervalMs: 50 };
      const lowGuard = createMemoryLeakGuard(lowGrowthConfig);
      
      lowGuard.start();
      
      // Wait for baseline establishment
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Simulate high growth rate (50% increase)
      mockMemoryUsage.mockReturnValue({
        rss: 1024 * 1024 * 150, // 150MB (50% increase from 100MB)
        heapUsed: 1024 * 1024 * 75,
        heapTotal: 1024 * 1024 * 80,
        external: 1024 * 1024 * 10,
        arrayBuffers: 1024 * 1024 * 5,
      });
      
      // Wait for new sample and detection
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const state = lowGuard.getState();
      expect(state.lastDetection).toBeDefined();
      expect(state.lastDetection!.detected).toBe(true);
      expect(state.lastDetection!.alertLevel).toBe('warning');
      expect(state.lastDetection!.reason).toContain('growth rate');
      
      lowGuard.stop();
    });

    it('should respect alert cooldown', async () => {
      const shortCooldownConfig = { ...mockConfig, thresholdMB: 50, alertCooldownMs: 100, baselineDurationMs: 100, samplingIntervalMs: 50 };
      const shortGuard = createMemoryLeakGuard(shortCooldownConfig);
      
      shortGuard.start();
      
      // Wait for baseline establishment
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Trigger first detection
      mockMemoryUsage.mockReturnValue({
        rss: 1024 * 1024 * 150,
        heapUsed: 1024 * 1024 * 75,
        heapTotal: 1024 * 1024 * 80,
        external: 1024 * 1024 * 10,
        arrayBuffers: 1024 * 1024 * 5,
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const firstDetectionCount = shortGuard.getState().detectionHistory.length;
      expect(firstDetectionCount).toBeGreaterThan(0);
      
      // Try to trigger second detection within cooldown
      mockMemoryUsage.mockReturnValue({
        rss: 1024 * 1024 * 160,
        heapUsed: 1024 * 1024 * 80,
        heapTotal: 1024 * 1024 * 80,
        external: 1024 * 1024 * 10,
        arrayBuffers: 1024 * 1024 * 5,
      });
      
      await new Promise(resolve => setTimeout(resolve, 50)); // Within cooldown
      
      const secondDetectionCount = shortGuard.getState().detectionHistory.length;
      expect(secondDetectionCount).toBe(firstDetectionCount); // No new detection
      
      shortGuard.stop();
    });

    it('should send telemetry event on detection', async () => {
      const telemetryConfig = { ...mockConfig, thresholdMB: 50, baselineDurationMs: 100, samplingIntervalMs: 50 };
      const telemetryGuard = createMemoryLeakGuard(telemetryConfig);
      
      telemetryGuard.start();
      
      // Wait for baseline establishment
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Trigger detection
      mockMemoryUsage.mockReturnValue({
        rss: 1024 * 1024 * 150,
        heapUsed: 1024 * 1024 * 75,
        heapTotal: 1024 * 1024 * 80,
        external: 1024 * 1024 * 10,
        arrayBuffers: 1024 * 1024 * 5,
      });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
        'analytics_memory_leak_detected',
        expect.any(Object)
      );
      
      const telemetryCall = mockTrackTelemetryEvent.mock.calls[0];
      expect(telemetryCall[0]).toBe('analytics_memory_leak_detected');
      expect(telemetryCall[1]).toHaveProperty('eventType', 'analytics_memory_leak_detected');
      expect(telemetryCall[1]).toHaveProperty('alertLevel');
      expect(telemetryCall[1]).toHaveProperty('currentMemoryMB');
      expect(telemetryCall[1]).toHaveProperty('baselineMemoryMB');
      
      telemetryGuard.stop();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      guard.updateConfig({
        thresholdMB: 200,
        verbose: true,
      });
      
      const state = guard.getState();
      expect(state.config.thresholdMB).toBe(200);
      expect(state.config.verbose).toBe(true);
      expect(state.config.samplingIntervalMs).toBe(mockConfig.samplingIntervalMs); // Unchanged
    });

    it('should validate configuration', () => {
      expect(() => {
        guard.updateConfig({
          thresholdMB: -10, // Invalid
        });
      }).not.toThrow(); // Zod should handle validation
      
      // Check that invalid values are handled
      const state = guard.getState();
      expect(state.config.thresholdMB).toBeGreaterThanOrEqual(10);
    });
  });

  describe('State Management', () => {
    it('should reset guard state', async () => {
      guard.start();
      
      // Wait for some samples
      await new Promise(resolve => setTimeout(resolve, mockConfig.samplingIntervalMs + 100));
      
      guard.reset();
      
      const state = guard.getState();
      expect(state.snapshots).toEqual([]);
      expect(state.baseline).toBeNull();
      expect(state.lastDetection).toBeNull();
      expect(state.totalSamples).toBe(0);
      expect(state.detectionHistory).toEqual([]);
    });

    it('should export and import state', async () => {
      guard.start();
      
      // Wait for some samples
      await new Promise(resolve => setTimeout(resolve, mockConfig.samplingIntervalMs + 100));
      
      const exportedData = guard.exportData();
      expect(exportedData.state).toBeDefined();
      expect(exportedData.exportTimestamp).toBeDefined();
      expect(exportedData.version).toBe('1.0.0');
      
      // Create new guard and import data
      const newGuard = createMemoryLeakGuard();
      newGuard.importData(exportedData);
      
      const importedState = newGuard.getState();
      expect(importedState.totalSamples).toBe(exportedData.state.totalSamples);
      expect(importedState.config.thresholdMB).toBe(exportedData.state.config.thresholdMB);
      
      guard.stop();
      newGuard.stop();
    });

    it('should reject invalid version on import', () => {
      const invalidData = {
        state: guard.getState(),
        exportTimestamp: Date.now(),
        version: '2.0.0', // Invalid version
      };
      
      expect(() => {
        guard.importData(invalidData);
      }).toThrow('Unsupported data version: 2.0.0');
    });
  });

  describe('Detection History', () => {
    it('should maintain detection history', async () => {
      const historyConfig = { ...mockConfig, thresholdMB: 50, baselineDurationMs: 100, samplingIntervalMs: 50 };
      const historyGuard = createMemoryLeakGuard(historyConfig);
      
      historyGuard.start();
      
      // Wait for baseline establishment
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Trigger multiple detections
      for (let i = 0; i < 3; i++) {
        mockMemoryUsage.mockReturnValue({
          rss: 1024 * 1024 * (150 + i * 10),
          heapUsed: 1024 * 1024 * (75 + i * 5),
          heapTotal: 1024 * 1024 * 80,
          external: 1024 * 1024 * 10,
          arrayBuffers: 1024 * 1024 * 5,
        });
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const history = historyGuard.getDetectionHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].detected).toBe(true);
      expect(history[0].alertLevel).toBe('critical');
      
      historyGuard.stop();
    });

    it('should limit detection history size', async () => {
      const smallHistoryConfig = { ...mockConfig, thresholdMB: 50, baselineDurationMs: 100, samplingIntervalMs: 50 };
      const smallGuard = createMemoryLeakGuard(smallHistoryConfig);
      
      // Manually add many detections to test limit
      const state = smallGuard.getState();
      for (let i = 0; i < 60; i++) {
        const mockDetection: MemoryLeakDetection = {
          detected: true,
          trend: {
            current: {
              timestamp: Date.now(),
              memoryMB: 150,
              heapSizeMB: 75,
              heapObjects: 75000,
              availableMB: 5,
              pid: 12345,
              nodeVersion: 'v18.0.0',
              platform: 'linux',
            },
            baseline: {
              timestamp: Date.now() - 10000,
              memoryMB: 100,
              heapSizeMB: 50,
              heapObjects: 50000,
              availableMB: 30,
              pid: 12345,
              nodeVersion: 'v18.0.0',
              platform: 'linux',
            },
            growthRate: 0.5,
            direction: 'increasing',
            elapsedMs: 10000,
            sampleCount: 10,
            slope: 5,
            rSquared: 0.9,
          },
          alertLevel: 'critical',
          timestamp: Date.now(),
          reason: 'Test detection',
          recommendations: ['Test recommendation'],
          previousDetections: [],
          growthRate: 0.5,
        };
        
        state.detectionHistory.push(mockDetection);
      }
      
      expect(state.detectionHistory.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Default Instance', () => {
    it('should provide default guard instance', () => {
      expect(defaultMemoryLeakGuard).toBeInstanceOf(MemoryLeakGuard);
      expect(defaultMemoryLeakGuard.getState().config.thresholdMB).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero memory usage', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 0,
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0,
      });
      
      guard.start();
      
      // Should not crash with zero memory
      expect(() => {
        const snapshot = guard.getCurrentSnapshot();
        expect(snapshot?.memoryMB).toBe(0);
      }).not.toThrow();
      
      guard.stop();
    });

    it('should handle very large memory values', () => {
      mockMemoryUsage.mockReturnValue({
        rss: Number.MAX_SAFE_INTEGER,
        heapUsed: Number.MAX_SAFE_INTEGER,
        heapTotal: Number.MAX_SAFE_INTEGER,
        external: Number.MAX_SAFE_INTEGER,
        arrayBuffers: Number.MAX_SAFE_INTEGER,
      });
      
      guard.start();
      
      // Should not crash with large values
      expect(() => {
        const snapshot = guard.getCurrentSnapshot();
        expect(snapshot?.memoryMB).toBeGreaterThan(0);
      }).not.toThrow();
      
      guard.stop();
    });

    it('should handle multiple start/stop cycles', () => {
      for (let i = 0; i < 5; i++) {
        guard.start();
        expect(guard.getState().active).toBe(true);
        
        guard.stop();
        expect(guard.getState().active).toBe(false);
      }
    });

    it('should handle stop when not started', () => {
      expect(() => {
        guard.stop(); // Should not throw
      }).not.toThrow();
    });

    it('should handle start when already started', () => {
      guard.start();
      
      expect(() => {
        guard.start(); // Should not throw
      }).not.toThrow();
      
      guard.stop();
    });
  });
});
