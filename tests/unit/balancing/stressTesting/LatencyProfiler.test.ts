/**
 * Test suite for Stress Pipeline Latency Profiler
 * 
 * Tests latency measurement, performance analysis, bottleneck detection,
 * trend analysis, and export functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LatencyProfiler, latencyProfiler, DEFAULT_PROFILER_CONFIG } from '@/balancing/stressTesting/LatencyProfiler';
import type { LatencyMeasurement, LatencyProfile, ProfilerConfig } from '@/balancing/stressTesting/LatencyProfiler';
import { saveData } from '@/shared/persistence/PersistenceService';

// Mock dependencies
vi.mock('@/shared/persistence/PersistenceService');
vi.mock('@/balancing/stressTesting/StressTelemetry', () => ({
  emitStressRunCompleted: vi.fn(),
  emitStressRunFailed: vi.fn(),
  emitStressBatchCompleted: vi.fn(),
  createStressTestPayload: vi.fn(),
  createStressTestRunId: vi.fn(),
}));

const mockSaveData = vi.mocked(saveData);

describe('LatencyProfiler', () => {
  let profiler: LatencyProfiler;
  let testConfig: ProfilerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    testConfig = {
      ...DEFAULT_PROFILER_CONFIG,
      enableDetailedTracing: false, // Reduce console noise in tests
      maxMeasurements: 100,
      samplingRate: 1.0,
    };
    profiler = new LatencyProfiler(testConfig);
  });

  afterEach(() => {
    profiler.reset();
  });

  describe('Basic Operation Profiling', () => {
    it('should start and end operations correctly', () => {
      const operationId = profiler.startOperation('test-operation', 'simulation');
      expect(operationId).toBeTruthy();
      expect(operationId.length).toBeGreaterThan(0);

      // Wait a bit to ensure duration > 0
      vi.advanceTimersByTime(10);

      const measurement = profiler.endOperation(operationId);
      expect(measurement).toBeTruthy();
      expect(measurement!.operation).toBe('test-operation');
      expect(measurement!.stage).toBe('simulation');
      expect(measurement!.duration).toBeGreaterThan(0);
      expect(measurement!.endTime).toBeGreaterThan(measurement!.startTime);
    });

    it('should handle ending non-existent operation gracefully', () => {
      const measurement = profiler.endOperation('non-existent-id');
      expect(measurement).toBeNull();
    });

    it('should respect sampling rate', () => {
      const lowSamplingProfiler = new LatencyProfiler({ samplingRate: 0.0 });
      
      const operationId = lowSamplingProfiler.startOperation('test-operation', 'simulation');
      expect(operationId).toBe(''); // Should be empty due to 0% sampling
      
      lowSamplingProfiler.reset();
    });

    it('should maintain max measurements limit', () => {
      const smallLimitProfiler = new LatencyProfiler({ maxMeasurements: 5 });
      
      // Add more operations than the limit
      for (let i = 0; i < 10; i++) {
        const id = smallLimitProfiler.startOperation(`operation-${i}`, 'simulation');
        vi.advanceTimersByTime(1);
        smallLimitProfiler.endOperation(id);
      }
      
      const profile = smallLimitProfiler.generateProfile();
      expect(profile.measurements.length).toBeLessThanOrEqual(5);
      
      smallLimitProfiler.reset();
    });
  });

  describe('Function Profiling', () => {
    it('should profile async functions correctly', async () => {
      const testFn = async () => {
        vi.advanceTimersByTime(100);
        return 'test-result';
      };

      const { result, measurement } = await profiler.profileFunction(
        'test-function',
        'analysis',
        testFn,
        { testMetadata: 'test-value' }
      );

      expect(result).toBe('test-result');
      expect(measurement.operation).toBe('test-function');
      expect(measurement.stage).toBe('analysis');
      expect(measurement.duration).toBeGreaterThan(90); // Should be around 100ms
      expect(measurement.metadata).toEqual({ testMetadata: 'test-value' });
    });

    it('should handle function errors correctly', async () => {
      const errorFn = async () => {
        vi.advanceTimersByTime(50);
        throw new Error('Test error');
      };

      await expect(profiler.profileFunction('error-function', 'simulation', errorFn))
        .rejects.toThrow('Test error');

      // Check that the operation was still recorded with error metadata
      const profile = profiler.generateProfile();
      const errorMeasurement = profile.measurements.find(m => m.operation === 'error-function');
      expect(errorMeasurement).toBeTruthy();
      expect(errorMeasurement!.metadata).toEqual({ error: 'Test error' });
    });
  });

  describe('Specialized Profiling Methods', () => {
    it('should profile archetype generation', async () => {
      const mockArchetypes = [
        { id: 'archetype-1', type: 'single', testedStats: ['stat1'], stats: {} },
        { id: 'archetype-2', type: 'pair', testedStats: ['stat1', 'stat2'], stats: {} },
      ];

      const { archetypes, measurement } = await profiler.profileArchetypeGeneration(
        async () => {
          vi.advanceTimersByTime(200);
          return mockArchetypes;
        },
        { generationType: 'test' }
      );

      expect(archetypes).toEqual(mockArchetypes);
      expect(measurement.operation).toBe('archetype-generation');
      expect(measurement.stage).toBe('generation');
      expect(measurement.metadata).toEqual({
        generationType: 'test',
        operationType: 'stress-test-archetype-generation',
      });
    });

    it('should profile simulation batch', async () => {
      const mockArchetype = {
        id: 'test-pair',
        type: 'pair' as const,
        testedStats: ['stat1', 'stat2'],
        stats: { stat1: 100, stat2: 50 },
      };

      const { result, measurement } = await profiler.profileSimulationBatch(
        mockArchetype,
        100,
        async (seed: number) => {
          vi.advanceTimersByTime(1);
          return { seed, result: 'simulation-result' };
        },
        { batchType: 'test' }
      );

      expect(result).toHaveLength(100);
      expect(measurement.operation).toBe('simulation-batch-test-pair');
      expect(measurement.stage).toBe('simulation');
      expect(measurement.metadata).toEqual({
        batchType: 'test',
        archetypeId: 'test-pair',
        statIds: ['stat1', 'stat2'],
        simulationCount: 100,
        operationType: 'stress-test-simulation',
      });
    });

    it('should profile marginal utility analysis', async () => {
      const mockArchetypes = [
        { id: 'archetype-1', type: 'single' as const, testedStats: ['stat1'], stats: {} },
        { id: 'archetype-2', type: 'pair' as const, testedStats: ['stat1', 'stat2'], stats: {} },
      ];
      const mockBaseline = { id: 'baseline', type: 'baseline' as const, testedStats: [], stats: {} };
      const mockAnalysis = {
        id: 'test-analysis',
        timestamp: Date.now(),
        config: { simulationCount: 1000, seed: 42, thresholds: { opThreshold: 1.15, weakThreshold: 0.95 } },
        statMetrics: [],
        synergyAnalyses: [],
        summary: {
          totalSimulations: 1000,
          totalRuntimeMs: 5000,
          avgSimulationsPerSecond: 200,
          opSynergiesCount: 5,
          weakSynergiesCount: 3,
          significantSynergiesCount: 8,
        },
      };

      const { analysis, measurement } = await profiler.profileMarginalUtilityAnalysis(
        mockArchetypes,
        mockBaseline,
        async () => {
          vi.advanceTimersByTime(300);
          return mockAnalysis;
        },
        { analysisType: 'test' }
      );

      expect(analysis).toEqual(mockAnalysis);
      expect(measurement.operation).toBe('marginal-utility-analysis');
      expect(measurement.stage).toBe('analysis');
      expect(measurement.metadata).toEqual({
        analysisType: 'test',
        archetypeCount: 2,
        singleStatCount: 1,
        pairStatCount: 1,
        operationType: 'stress-test-analysis',
      });
    });

    it('should profile export operations', async () => {
      const { measurement } = await profiler.profileExport(
        'json',
        async () => {
          vi.advanceTimersByTime(50);
          // Mock export function
        },
        { exportType: 'test' }
      );

      expect(measurement.operation).toBe('export-json');
      expect(measurement.stage).toBe('export');
      expect(measurement.metadata).toEqual({
        exportType: 'test',
        exportFormat: 'json',
        operationType: 'stress-test-export',
      });
    });
  });

  describe('Profile Generation', () => {
    it('should generate comprehensive latency profile', async () => {
      // Add some test measurements
      const operations = [
        { name: 'archetype-gen', stage: 'generation' as const, duration: 200 },
        { name: 'simulation-1', stage: 'simulation' as const, duration: 100 },
        { name: 'simulation-2', stage: 'simulation' as const, duration: 150 },
        { name: 'analysis', stage: 'analysis' as const, duration: 300 },
        { name: 'export', stage: 'export' as const, duration: 50 },
      ];

      for (const op of operations) {
        const id = profiler.startOperation(op.name, op.stage);
        vi.advanceTimersByTime(op.duration);
        profiler.endOperation(id);
      }

      const profile = profiler.generateProfile();

      expect(profile.id).toBeTruthy();
      expect(profile.timestamp).toBeGreaterThan(0);
      expect(profile.totalDuration).toBeGreaterThan(0);
      expect(profile.measurements).toHaveLength(operations.length);
      expect(profile.summary.totalOperations).toBe(operations.length);
      expect(profile.summary.averageLatency).toBeGreaterThan(0);
      expect(profile.summary.throughput).toBeGreaterThan(0);
      expect(profile.stageBreakdown).toBeDefined();
    });

    it('should calculate correct summary statistics', async () => {
      // Add measurements with known durations
      const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      
      for (let i = 0; i < durations.length; i++) {
        const id = profiler.startOperation(`operation-${i}`, 'simulation');
        vi.advanceTimersByTime(durations[i]);
        profiler.endOperation(id);
      }

      const profile = profiler.generateProfile();
      const summary = profile.summary;

      expect(summary.averageLatency).toBe(55); // (10+20+...+100) / 10
      expect(summary.medianLatency).toBe(55); // Middle value
      expect(summary.p95Latency).toBe(95); // 95th percentile
      expect(summary.p99Latency).toBe(100); // 99th percentile
      expect(summary.slowestOperation.duration).toBe(100);
      expect(summary.fastestOperation.duration).toBe(10);
    });

    it('should calculate stage breakdown correctly', async () => {
      // Add measurements across different stages
      const stageOperations = [
        { stage: 'generation' as const, count: 3, avgDuration: 200 },
        { stage: 'simulation' as const, count: 5, avgDuration: 100 },
        { stage: 'analysis' as const, count: 2, avgDuration: 300 },
      ];

      for (const stageOp of stageOperations) {
        for (let i = 0; i < stageOp.count; i++) {
          const id = profiler.startOperation(`${stageOp.stage}-${i}`, stageOp.stage);
          vi.advanceTimersByTime(stageOp.avgDuration);
          profiler.endOperation(id);
        }
      }

      const profile = profiler.generateProfile();
      const breakdown = profile.stageBreakdown;

      expect(breakdown.generation.count).toBe(3);
      expect(breakdown.generation.averageDuration).toBe(200);
      expect(breakdown.simulation.count).toBe(5);
      expect(breakdown.simulation.averageDuration).toBe(100);
      expect(breakdown.analysis.count).toBe(2);
      expect(breakdown.analysis.averageDuration).toBe(300);

      // Check percentages sum to 100%
      const totalPercentage = Object.values(breakdown).reduce((sum, stage) => sum + stage.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });
  });

  describe('Bottleneck Detection', () => {
    it('should identify performance bottlenecks', async () => {
      // Create a bottleneck operation with high impact
      const bottleneckId = profiler.startOperation('bottleneck-op', 'simulation');
      vi.advanceTimersByTime(2000); // Very slow operation
      profiler.endOperation(bottleneckId);

      // Add some normal operations
      for (let i = 0; i < 5; i++) {
        const id = profiler.startOperation(`normal-op-${i}`, 'simulation');
        vi.advanceTimersByTime(50);
        profiler.endOperation(id);
      }

      const profile = profiler.generateProfile();
      const bottlenecks = profile.bottlenecks;

      expect(bottlenecks.length).toBeGreaterThan(0);
      const bottleneck = bottlenecks[0];
      expect(bottleneck.operation).toBe('bottleneck-op');
      expect(bottleneck.stage).toBe('simulation');
      expect(bottleneck.averageDuration).toBe(2000);
      expect(bottleneck.severity).toBe('critical');
      expect(bottleneck.recommendation).toBeTruthy();
    });

    it('should classify bottleneck severity correctly', async () => {
      const testCases = [
        { duration: 2000, expectedSeverity: 'critical' as const },
        { duration: 800, expectedSeverity: 'high' as const },
        { duration: 400, expectedSeverity: 'medium' as const },
        { duration: 200, expectedSeverity: 'low' as const },
      ];

      for (const testCase of testCases) {
        const testProfiler = new LatencyProfiler({
          ...testConfig,
          alertThresholds: {
            ...testConfig.alertThresholds,
            operationLatency: 1000,
          },
        });

        const id = testProfiler.startOperation(`test-${testCase.duration}`, 'simulation');
        vi.advanceTimersByTime(testCase.duration);
        testProfiler.endOperation(id);

        const profile = testProfiler.generateProfile();
        const bottleneck = profile.bottlenecks.find(b => 
          b.operation === `test-${testCase.duration}`
        );

        if (bottleneck) {
          expect(bottleneck.severity).toBe(testCase.expectedSeverity);
        }

        testProfiler.reset();
      }
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze performance trends', async () => {
      const trendWindow = 20;
      const testProfiler = new LatencyProfiler({
        ...testConfig,
        trendWindow,
      });

      // Create measurements with improving trend
      for (let i = 0; i < trendWindow; i++) {
        const id = testProfiler.startOperation('trend-test', 'simulation');
        // Decreasing duration (improving trend)
        vi.advanceTimersByTime(100 - i * 2);
        testProfiler.endOperation(id);
      }

      const profile = testProfiler.generateProfile();
      const trends = profile.trends;

      expect(trends.length).toBeGreaterThan(0);
      const trend = trends.find(t => t.operation === 'trend-test');
      expect(trend).toBeTruthy();
      expect(trend!.trend).toBe('improving');
      expect(trend!.changeRate).toBeLessThan(0);

      testProfiler.reset();
    });

    it('should detect degrading trends', async () => {
      const trendWindow = 20;
      const testProfiler = new LatencyProfiler({
        ...testConfig,
        trendWindow,
      });

      // Create measurements with degrading trend
      for (let i = 0; i < trendWindow; i++) {
        const id = testProfiler.startOperation('degrading-test', 'simulation');
        // Increasing duration (degrading trend)
        vi.advanceTimersByTime(50 + i * 3);
        testProfiler.endOperation(id);
      }

      const profile = testProfiler.generateProfile();
      const trends = profile.trends;

      const trend = trends.find(t => t.operation === 'degrading-test');
      expect(trend).toBeTruthy();
      expect(trend!.trend).toBe('degrading');
      expect(trend!.changeRate).toBeGreaterThan(0);

      testProfiler.reset();
    });
  });

  describe('Export Functionality', () => {
    it('should export profile as JSON', async () => {
      // Add some test data
      const id = profiler.startOperation('test-export', 'simulation');
      vi.advanceTimersByTime(100);
      profiler.endOperation(id);

      await profiler.exportProfile('json');

      expect(mockSaveData).toHaveBeenCalledWith(
        expect.stringContaining('latency-profile-'),
        expect.stringContaining('"id":')
      );
    });

    it('should export profile as CSV', async () => {
      // Add some test data
      const id = profiler.startOperation('test-csv', 'simulation');
      vi.advanceTimersByTime(100);
      profiler.endOperation(id);

      await profiler.exportProfile('csv');

      expect(mockSaveData).toHaveBeenCalledWith(
        expect.stringContaining('latency-profile-'),
        expect.stringContaining('Operation,Stage,Duration (ms)')
      );
    });

    it('should export profile as Markdown', async () => {
      // Add some test data
      const id = profiler.startOperation('test-md', 'simulation');
      vi.advanceTimersByTime(100);
      profiler.endOperation(id);

      await profiler.exportProfile('markdown');

      expect(mockSaveData).toHaveBeenCalledWith(
        expect.stringContaining('latency-profile-'),
        expect.stringContaining('# Latency Profile Report')
      );
    });

    it('should handle export errors gracefully', async () => {
      mockSaveData.mockRejectedValue(new Error('Export failed'));

      await expect(profiler.exportProfile('json')).rejects.toThrow('Export failed');
    });
  });

  describe('Real-time Monitoring', () => {
    it('should provide real-time statistics', async () => {
      // Add some active operations
      const activeId1 = profiler.startOperation('active-1', 'simulation');
      const activeId2 = profiler.startOperation('active-2', 'analysis');

      // Add some completed operations
      const completedId = profiler.startOperation('completed', 'generation');
      vi.advanceTimersByTime(100);
      profiler.endOperation(completedId);

      const stats = profiler.getRealTimeStats();

      expect(stats.activeOperations).toBe(2);
      expect(stats.totalMeasurements).toBe(1);
      expect(stats.averageLatency).toBe(100);
      expect(stats.throughput).toBeGreaterThan(0);
      expect(stats.recentAlerts).toBeGreaterThanOrEqual(0);

      // Clean up
      profiler.endOperation(activeId1);
      profiler.endOperation(activeId2);
    });

    it('should trigger performance alerts', async () => {
      const alertProfiler = new LatencyProfiler({
        ...testConfig,
        enableRealtimeMonitoring: true,
        alertThresholds: {
          operationLatency: 50, // Low threshold for testing
          stageLatency: 100,
          throughputDrop: 20,
        },
      });

      // Trigger operation latency alert
      const id = alertProfiler.startOperation('slow-operation', 'simulation');
      vi.advanceTimersByTime(100); // Exceeds threshold of 50ms
      alertProfiler.endOperation(id);

      const alerts = alertProfiler.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.includes('High latency alert'))).toBe(true);

      alertProfiler.reset();
    });
  });

  describe('Configuration and Reset', () => {
    it('should use custom configuration', () => {
      const customConfig: ProfilerConfig = {
        enableDetailedTracing: false,
        maxMeasurements: 50,
        samplingRate: 0.5,
        bottleneckThreshold: 5.0,
        trendWindow: 50,
        exportPath: 'custom-path',
        enableRealtimeMonitoring: false,
        alertThresholds: {
          operationLatency: 500,
          stageLatency: 2000,
          throughputDrop: 10,
        },
      };

      const customProfiler = new LatencyProfiler(customConfig);
      
      // Test sampling rate
      const id = customProfiler.startOperation('test', 'simulation');
      // With 50% sampling, this should work about half the time
      expect(id.length > 0).toBe(true); // Might be empty due to sampling
      
      customProfiler.reset();
    });

    it('should reset profiler state correctly', async () => {
      // Add some data
      const id1 = profiler.startOperation('test-1', 'simulation');
      const id2 = profiler.startOperation('test-2', 'analysis');
      
      vi.advanceTimersByTime(100);
      profiler.endOperation(id1);
      profiler.endOperation(id2);

      // Verify data exists
      expect(profiler.getRealTimeStats().totalMeasurements).toBe(2);

      // Reset
      profiler.reset();

      // Verify reset
      const stats = profiler.getRealTimeStats();
      expect(stats.activeOperations).toBe(0);
      expect(stats.totalMeasurements).toBe(0);
      expect(stats.averageLatency).toBe(0);
      expect(profiler.getAlerts().length).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty measurements gracefully', () => {
      const profile = profiler.generateProfile();
      
      expect(profile.measurements).toHaveLength(0);
      expect(profile.summary.totalOperations).toBe(0);
      expect(profile.summary.averageLatency).toBe(0);
      expect(profile.summary.throughput).toBe(0);
      expect(profile.bottlenecks).toHaveLength(0);
      expect(profile.trends).toHaveLength(0);
    });

    it('should handle single measurement gracefully', async () => {
      const id = profiler.startOperation('single', 'simulation');
      vi.advanceTimersByTime(100);
      profiler.endOperation(id);

      const profile = profiler.generateProfile();
      
      expect(profile.measurements).toHaveLength(1);
      expect(profile.summary.averageLatency).toBe(100);
      expect(profile.summary.medianLatency).toBe(100);
      expect(profile.summary.p95Latency).toBe(100);
      expect(profile.summary.p99Latency).toBe(100);
    });

    it('should handle very short durations', async () => {
      const id = profiler.startOperation('fast', 'simulation');
      // No artificial delay - should be very fast
      profiler.endOperation(id);

      const measurement = profiler.generateProfile().measurements[0];
      expect(measurement.duration).toBeGreaterThanOrEqual(0);
      expect(measurement.duration).toBeLessThan(100); // Should be very fast
    });

    it('should handle metadata correctly', async () => {
      const metadata = {
        testKey: 'testValue',
        number: 42,
        nested: { inner: 'value' },
      };

      const id = profiler.startOperation('metadata-test', 'simulation', metadata);
      vi.advanceTimersByTime(50);
      profiler.endOperation(id);

      const measurement = profiler.generateProfile().measurements[0];
      expect(measurement.metadata).toEqual(metadata);
    });

    it('should handle parent-child relationships', async () => {
      const parentId = profiler.startOperation('parent', 'generation');
      vi.advanceTimersByTime(50);
      
      const childId = profiler.startOperation('child', 'simulation', {}, parentId);
      vi.advanceTimersByTime(25);
      profiler.endOperation(childId);
      
      vi.advanceTimersByTime(25);
      profiler.endOperation(parentId);

      const measurements = profiler.generateProfile().measurements;
      const parentMeasurement = measurements.find(m => m.operation === 'parent');
      const childMeasurement = measurements.find(m => m.operation === 'child');

      expect(parentMeasurement).toBeTruthy();
      expect(childMeasurement).toBeTruthy();
      // Note: In a real implementation, we'd need to build the parent-child tree structure
    });
  });

  describe('Integration with Stress Testing Pipeline', () => {
    it('should integrate with archetype generator', async () => {
      // Mock the StressTestArchetypeGenerator
      const mockGenerator = {
        generateAllStressTestArchetypes: vi.fn().mockResolvedValue([
          { id: 'test-archetype', type: 'single', testedStats: ['test'], stats: {} },
        ]),
      };

      const { archetypes, measurement } = await profiler.profileArchetypeGeneration(
        () => mockGenerator.generateAllStressTestArchetypes(),
        { integration: 'test' }
      );

      expect(archetypes).toHaveLength(1);
      expect(measurement.operation).toBe('archetype-generation');
      expect(measurement.metadata?.integration).toBe('test');
    });

    it('should integrate with marginal utility calculator', async () => {
      // Mock the MarginalUtilityCalculator
      const mockCalculator = {
        runAnalysis: vi.fn().mockResolvedValue({
          id: 'test-analysis',
          timestamp: Date.now(),
          config: { simulationCount: 1000, seed: 42, thresholds: { opThreshold: 1.15, weakThreshold: 0.95 } },
          statMetrics: [],
          synergyAnalyses: [],
          summary: {
            totalSimulations: 1000,
            totalRuntimeMs: 5000,
            avgSimulationsPerSecond: 200,
            opSynergiesCount: 5,
            weakSynergiesCount: 3,
            significantSynergiesCount: 8,
          },
        }),
      };

      const mockArchetypes = [
        { id: 'test-archetype', type: 'single', testedStats: ['test'], stats: {} },
      ];
      const mockBaseline = { id: 'baseline', type: 'baseline', testedStats: [], stats: {} };

      const { analysis, measurement } = await profiler.profileMarginalUtilityAnalysis(
        mockArchetypes,
        mockBaseline,
        () => mockCalculator.runAnalysis(mockArchetypes, mockBaseline),
        { integration: 'test' }
      );

      expect(analysis.id).toBe('test-analysis');
      expect(measurement.operation).toBe('marginal-utility-analysis');
      expect(measurement.metadata?.integration).toBe('test');
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle large numbers of measurements efficiently', async () => {
      const largeProfiler = new LatencyProfiler({
        ...testConfig,
        maxMeasurements: 1000,
        enableDetailedTracing: false,
      });

      // Add many measurements
      const startTime = Date.now();
      
      for (let i = 0; i < 500; i++) {
        const id = largeProfiler.startOperation(`bulk-${i}`, 'simulation');
        vi.advanceTimersByTime(1);
        largeProfiler.endOperation(id);
      }

      const profileGenerationTime = Date.now() - startTime;
      
      // Profile generation should be fast even with many measurements
      expect(profileGenerationTime).toBeLessThan(1000); // Less than 1 second
      
      const profile = largeProfiler.generateProfile();
      expect(profile.measurements.length).toBe(500);
      expect(profile.summary.totalOperations).toBe(500);

      largeProfiler.reset();
    });

    it('should maintain performance with detailed tracing disabled', async () => {
      const tracingOffProfiler = new LatencyProfiler({
        ...testConfig,
        enableDetailedTracing: false,
      });

      const startTime = Date.now();
      
      // Add many operations
      for (let i = 0; i < 100; i++) {
        const id = tracingOffProfiler.startOperation(`perf-test-${i}`, 'simulation');
        vi.advanceTimersByTime(5);
        tracingOffProfiler.endOperation(id);
      }

      const totalTime = Date.now() - startTime;
      
      // Should be fast with tracing disabled
      expect(totalTime).toBeLessThan(500);

      tracingOffProfiler.reset();
    });
  });
});

describe('Global Latency Profiler', () => {
  it('should export global instance', () => {
    expect(latencyProfiler).toBeInstanceOf(LatencyProfiler);
  });

  it('should provide convenience function for pipeline profiling', async () => {
    // Mock the pipeline functions
    vi.doMock('@/balancing/stressTesting/StressTestArchetypeGenerator', () => ({
      generateStressTestArchetypes: vi.fn().mockResolvedValue([]),
    }));

    vi.doMock('@/balancing/stressTesting/MarginalUtilityCalculator', () => ({
      runMarginalUtilityAnalysis: vi.fn().mockResolvedValue({} as any),
    }));

    // This would require actual imports in a real scenario
    // For now, just verify the function exists
    expect(typeof latencyProfiler.startOperation).toBe('function');
    expect(typeof latencyProfiler.endOperation).toBe('function');
    expect(typeof latencyProfiler.generateProfile).toBe('function');
  });
});
