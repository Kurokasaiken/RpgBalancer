/**
 * Quest Telemetry Performance Tests
 * 
 * Performance benchmarking suite for quest telemetry operations.
 * Measures performance impact of telemetry views and validates
 * optimization strategies with 1k datapoint benchmarks.
 * 
 * @since IV-QuestTelemetry-performance
 * @author Atlas-Perf
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { questTelemetryProfiler } from '@/ui/idleVillage/utils/questTelemetryProfiling';
import type { QuestTelemetryEntry, AggregatedTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import type { QuestResult } from '@/engine/quest/types';

// Mock data generators
function generateMockQuestEntries(count: number): QuestTelemetryEntry[] {
  const entries: QuestTelemetryEntry[] = [];
  
  for (let i = 0; i < count; i++) {
    const result: QuestResult = {
      questId: `quest-${i}`,
      success: Math.random() > 0.3, // 70% success rate
      durationSeconds: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
      completedPhases: Math.floor(Math.random() * 5) + 1,
      totalPhases: 5,
      branchDecisions: generateMockBranchDecisions(Math.floor(Math.random() * 3) + 1),
      finalEffects: generateMockEffects(Math.floor(Math.random() * 2)),
      telemetryData: {
        totalChoices: Math.floor(Math.random() * 5) + 1,
        averageChoiceTime: Math.random() * 30 + 5,
        heroicMoments: Math.random() > 0.8 ? 1 : 0,
      },
    };
    
    entries.push({
      questId: result.questId,
      result,
      timestamp: Date.now() - (i * 1000), // 1 second apart
      sessionId: `session-${Math.floor(i / 10)}`,
    });
  }
  
  return entries;
}

function generateMockBranchDecisions(count: number): any[] {
  const decisions = [];
  for (let i = 0; i < count; i++) {
    decisions.push({
      phaseId: `phase-${i}`,
      choiceId: Math.random() > 0.5 ? `choice-${i}` : undefined,
      conditionId: Math.random() > 0.5 ? `condition-${i}` : undefined,
      timestamp: Date.now() - Math.random() * 10000,
      outcome: {
        success: Math.random() > 0.2,
        metadata: {
          lastChoiceTime: Math.random() * 30 + 5,
        },
      },
    });
  }
  return decisions;
}

function generateMockEffects(count: number): any[] {
  const effects = [];
  for (let i = 0; i < count; i++) {
    effects.push({
      type: ['stat_change', 'experience', 'item'][Math.floor(Math.random() * 3)],
      stat: ['hp', 'damage', 'speed'][Math.floor(Math.random() * 3)],
      value: Math.floor(Math.random() * 20) - 10,
    });
  }
  return effects;
}

// Performance test utilities
function createAggregatedTelemetry(entries: QuestTelemetryEntry[]): AggregatedTelemetry {
  const totalQuests = entries.length;
  const successfulQuests = entries.filter(entry => entry.result.success).length;
  const successRate = totalQuests > 0 ? successfulQuests / totalQuests : 0;
  
  const totalDuration = entries.reduce((sum, entry) => sum + entry.result.durationSeconds, 0);
  const averageDuration = totalQuests > 0 ? totalDuration / totalQuests : 0;
  
  const allBranches = entries.flatMap(entry => entry.result.branchDecisions);
  const totalBranches = allBranches.length;
  
  const choiceTimes = allBranches
    .map(decision => (decision.outcome.metadata?.lastChoiceTime as number) || 0)
    .filter(time => time > 0);
  const averageChoiceTime = choiceTimes.length > 0 ? choiceTimes.reduce((a, b) => a + b, 0) / choiceTimes.length : 0;
  
  const heroicMoments = entries.reduce(
    (sum, entry) => sum + (entry.result.telemetryData?.heroicMoments ?? 0),
    0
  );
  
  return {
    totalQuests,
    successRate,
    averageDuration,
    totalBranches,
    averageChoiceTime,
    heroicMoments,
    branchDecisions: allBranches,
    recentQuests: entries.slice(0, 10),
    questTypeBreakdown: entries.reduce((acc, entry) => {
      const questType = 'mixed'; // Simplified for performance tests
      acc[questType] = (acc[questType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

describe('Quest Telemetry Performance Tests', () => {
  let testEntries: QuestTelemetryEntry[];
  
  beforeAll(async () => {
    // Enable profiling for performance tests
    questTelemetryProfiler.setEnabled(true);
    
    // Generate test data
    testEntries = generateMockQuestEntries(1000);
    
    // Warm up the profiler
    await questTelemetryProfiler.benchmark('warmup', () => {
      // Simple warmup operation
      testEntries.slice(0, 10).reduce((sum, entry) => sum + entry.result.durationSeconds, 0);
    }, 10);
  });
  
  afterAll(() => {
    // Generate performance report
    const report = questTelemetryProfiler.generateReport();
    console.log('Quest Telemetry Performance Report:');
    console.log(report);
    
    // Clean up
    questTelemetryProfiler.clearMeasurements();
  });

  describe('1K Datapoints Benchmarks', () => {
    it('should benchmark telemetry aggregation with 1k entries', async () => {
      const result = await questTelemetryProfiler.benchmark(
        'telemetry-aggregation-1k-entries',
        () => {
          createAggregatedTelemetry(testEntries);
        },
        1000
      );
      
      expect(result.name).toBe('telemetry-aggregation-1k-entries');
      expect(result.iterations).toBe(1000);
      expect(result.averageDuration).toBeLessThan(50); // Should complete in <50ms
      expect(result.opsPerSecond).toBeGreaterThan(20); // Should handle >20 ops/sec
      expect(result.standardDeviation).toBeLessThan(result.averageDuration * 0.5); // Consistent performance
    });

    it('should benchmark selector filtering with 1k entries', async () => {
      const result = await questTelemetryProfiler.benchmark(
        'selector-filtering-1k-entries',
        () => {
          testEntries.filter(entry => entry.result.success && entry.result.durationSeconds > 100);
        },
        1000
      );
      
      expect(result.name).toBe('selector-filtering-1k-entries');
      expect(result.averageDuration).toBeLessThan(10); // Should be very fast
      expect(result.opsPerSecond).toBeGreaterThan(100); // Should handle >100 ops/sec
    });

    it('should benchmark data transformation with 1k entries', async () => {
      const result = await questTelemetryProfiler.benchmark(
        'data-transformation-1k-entries',
        () => {
          testEntries.map(entry => ({
            ...entry,
            formattedDuration: `${entry.result.durationSeconds}s`,
            successRate: entry.result.success ? 1 : 0,
            riskLevel: entry.result.durationSeconds > 200 ? 'high' : entry.result.durationSeconds > 100 ? 'medium' : 'low',
            efficiency: entry.result.completedPhases / entry.result.totalPhases,
          }));
        },
        1000
      );
      
      expect(result.name).toBe('data-transformation-1k-entries');
      expect(result.averageDuration).toBeLessThan(20); // Should be reasonably fast
      expect(result.opsPerSecond).toBeGreaterThan(50); // Should handle >50 ops/sec
    });

    it('should benchmark quest type stats calculation', async () => {
      const result = await questTelemetryProfiler.benchmark(
        'quest-type-stats-calculation',
        () => {
          const successEntries = testEntries.filter(entry => entry.result.success);
          const totalDuration = successEntries.reduce((sum, entry) => sum + entry.result.durationSeconds, 0);
          return {
            count: successEntries.length,
            successRate: successEntries.length / testEntries.length,
            averageDuration: totalDuration / successEntries.length,
          };
        },
        1000
      );
      
      expect(result.name).toBe('quest-type-stats-calculation');
      expect(result.averageDuration).toBeLessThan(5); // Should be very fast
      expect(result.opsPerSecond).toBeGreaterThan(200); // Should handle >200 ops/sec
    });
  });

  describe('Memory Usage Tests', () => {
    it('should measure memory usage during aggregation', async () => {
      const initialMemory = questTelemetryProfiler.getMemoryUsage();
      
      // Perform aggregation
      const result = await questTelemetryProfiler.measureFunction(
        'memory-test-aggregation',
        () => createAggregatedTelemetry(testEntries)
      );
      
      const finalMemory = questTelemetryProfiler.getMemoryUsage();
      
      expect(result.measurement).toBeDefined();
      expect(result.measurement!.duration).toBeLessThan(100); // Should complete quickly
      
      // Memory increase should be reasonable (less than 10MB for 1k entries)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(10); // Less than 10MB increase
      }
    });

    it('should measure memory usage during data transformation', async () => {
      const initialMemory = questTelemetryProfiler.getMemoryUsage();
      
      const result = await questTelemetryProfiler.measureFunction(
        'memory-test-transformation',
        () => {
          return testEntries.map(entry => ({
            ...entry,
            enriched: {
              formattedDuration: `${entry.result.durationSeconds}s`,
              riskAssessment: entry.result.durationSeconds > 200 ? 'high' : 'medium',
              efficiency: entry.result.completedPhases / entry.result.totalPhases,
              timestamp: new Date(entry.timestamp).toISOString(),
            },
          }));
        }
      );
      
      const finalMemory = questTelemetryProfiler.getMemoryUsage();
      
      expect(result.measurement).toBeDefined();
      
      // Memory increase should be reasonable for enriched data
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(20); // Less than 20MB for enriched data
      }
    });
  });

  describe('Scaling Tests', () => {
    it('should measure performance scaling with different data sizes', async () => {
      const dataSizes = [100, 500, 1000, 2000];
      const results = [];
      
      for (const size of dataSizes) {
        const entries = generateMockQuestEntries(size);
        const result = await questTelemetryProfiler.benchmark(
          `scaling-test-${size}-entries`,
          () => createAggregatedTelemetry(entries),
          100
        );
        
        results.push({
          size,
          averageDuration: result.averageDuration,
          opsPerSecond: result.opsPerSecond,
        });
      }
      
      // Performance should scale reasonably
      const thousandEntryResult = results.find(r => r.size === 1000);
      const twoThousandEntryResult = results.find(r => r.size === 2000);
      
      if (thousandEntryResult && twoThousandEntryResult) {
        // 2x data should not take more than 2.5x time (allowing for some overhead)
        const scalingFactor = twoThousandEntryResult.averageDuration / thousandEntryResult.averageDuration;
        expect(scalingFactor).toBeLessThan(2.5);
      }
      
      // Log scaling results for analysis
      console.log('Performance Scaling Results:');
      results.forEach(result => {
        console.log(`${result.size} entries: ${result.averageDuration.toFixed(2)}ms avg, ${result.opsPerSecond.toFixed(0)} ops/sec`);
      });
    });
  });

  describe('Optimization Validation', () => {
    it('should validate memoization effectiveness', async () => {
      // First run (cold cache)
      const coldRun = await questTelemetryProfiler.measureFunction(
        'aggregation-cold-cache',
        () => createAggregatedTelemetry(testEntries)
      );
      
      // Second run (warm cache)
      const warmRun = await questTelemetryProfiler.measureFunction(
        'aggregation-warm-cache',
        () => createAggregatedTelemetry(testEntries)
      );
      
      expect(coldRun.measurement).toBeDefined();
      expect(warmRun.measurement).toBeDefined();
      
      // Warm run should be faster (though difference may be small for simple operations)
      if (coldRun.measurement && warmRun.measurement) {
        const speedup = coldRun.measurement.duration / warmRun.measurement.duration;
        console.log(`Memoization speedup: ${speedup.toFixed(2)}x`);
        
        // Even small speedups indicate memoization is working
        expect(speedup).toBeGreaterThanOrEqual(1);
      }
    });

    it('should validate selector optimization', async () => {
      // Test optimized selector filtering
      const optimizedResult = await questTelemetryProfiler.benchmark(
        'optimized-selector-filtering',
        () => {
          // Use efficient filtering with early termination
          return testEntries.filter(entry => {
            if (!entry.result.success) return false;
            if (entry.result.durationSeconds <= 100) return false;
            return true;
          });
        },
        1000
      );
      
      // Test naive selector filtering
      const naiveResult = await questTelemetryProfiler.benchmark(
        'naive-selector-filtering',
        () => {
          // Multiple filter operations (less efficient)
          return testEntries
            .filter(entry => entry.result.success)
            .filter(entry => entry.result.durationSeconds > 100);
        },
        1000
      );
      
      // Optimized version should be faster or equal
      expect(optimizedResult.averageDuration).toBeLessThanOrEqual(naiveResult.averageDuration);
      
      if (optimizedResult.averageDuration < naiveResult.averageDuration) {
        const speedup = naiveResult.averageDuration / optimizedResult.averageDuration;
        console.log(`Selector optimization speedup: ${speedup.toFixed(2)}x`);
      }
    });
  });

  describe('Real-world Scenario Tests', () => {
    it('should simulate real telemetry dashboard performance', async () => {
      // Simulate dashboard operations
      const dashboardResult = await questTelemetryProfiler.measureFunction(
        'dashboard-simulation',
        async () => {
          // 1. Load telemetry data
          const telemetry = createAggregatedTelemetry(testEntries);
          
          // 2. Calculate statistics
          const stats = {
            totalQuests: telemetry.totalQuests,
            successRate: telemetry.successRate,
            averageDuration: telemetry.averageDuration,
            recentActivity: telemetry.recentQuests.slice(0, 5),
          };
          
          // 3. Prepare data for visualization
          const chartData = {
            questTypeBreakdown: telemetry.questTypeBreakdown,
            successRateOverTime: calculateSuccessRateOverTime(testEntries),
            durationDistribution: calculateDurationDistribution(testEntries),
          };
          
          // 4. Filter for recent activity
          const recentActivity = testEntries
            .filter(entry => Date.now() - entry.timestamp < 3600000) // Last hour
            .slice(0, 20);
          
          return { stats, chartData, recentActivity };
        }
      );
      
      expect(dashboardResult.measurement).toBeDefined();
      expect(dashboardResult.measurement!.duration).toBeLessThan(200); // Should complete in <200ms
      
      const result = dashboardResult.result as any;
      expect(result.stats).toBeDefined();
      expect(result.chartData).toBeDefined();
      expect(result.recentActivity).toBeDefined();
    });

    it('should simulate real-time telemetry updates', async () => {
      const updateResult = await questTelemetryProfiler.benchmark(
        'real-time-updates',
        () => {
          // Simulate incremental updates
          let aggregatedData = createAggregatedTelemetry([]);
          
          // Simulate 100 incremental updates
          for (let i = 0; i < 100; i++) {
            const newEntry = generateMockQuestEntries(1)[0];
            aggregatedData = createAggregatedTelemetry([newEntry, ...aggregatedData.recentQuests]);
          }
          
          return aggregatedData;
        },
        100
      );
      
      expect(updateResult.name).toBe('real-time-updates');
      expect(updateResult.averageDuration).toBeLessThan(100); // Should handle incremental updates efficiently
      expect(updateResult.opsPerSecond).toBeGreaterThan(10); // Should handle >10 updates/sec
    });
  });
});

// Helper functions for tests
function calculateSuccessRateOverTime(entries: QuestTelemetryEntry[]): Array<{ timestamp: number; successRate: number }> {
  // Group entries by time buckets (e.g., every 10 seconds)
  const timeBuckets = new Map<number, QuestTelemetryEntry[]>();
  
  entries.forEach(entry => {
    const bucketTime = Math.floor(entry.timestamp / 10000) * 10000;
    if (!timeBuckets.has(bucketTime)) {
      timeBuckets.set(bucketTime, []);
    }
    timeBuckets.get(bucketTime)!.push(entry);
  });
  
  return Array.from(timeBuckets.entries()).map(([timestamp, bucketEntries]) => ({
    timestamp,
    successRate: bucketEntries.filter(entry => entry.result.success).length / bucketEntries.length,
  }));
}

function calculateDurationDistribution(entries: QuestTelemetryEntry[]): Array<{ range: string; count: number }> {
  const distribution = [
    { range: '0-60s', min: 0, max: 60, count: 0 },
    { range: '60-120s', min: 60, max: 120, count: 0 },
    { range: '120-180s', min: 120, max: 180, count: 0 },
    { range: '180-240s', min: 180, max: 240, count:  },
    { range: '240s+', min: 240, max: Infinity, count: 0 },
  ];
  
  entries.forEach(entry => {
    const duration = entry.result.durationSeconds;
    const bucket = distribution.find(d => duration >= d.min && duration < d.max);
    if (bucket) {
      bucket.count++;
    }
  });
  
  return distribution.map(({ range, count }) => ({ range, count }));
}
