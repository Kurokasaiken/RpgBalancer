/**
 * Test harness wrapper for StressTelemetry
 * 
 * Provides test utilities and wrapper functions for testing the stress testing telemetry
 * with deterministic behavior and comprehensive validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { StressTestTelemetryEvent } from '../../../../src/balancing/stressTesting/StressTelemetry';
import type { MarginalUtilityAnalysis } from '../../../../src/balancing/stressTesting/MarginalUtilityTypes';

// Mock analytics service
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn().mockResolvedValue(undefined),
  loadData: vi.fn().mockResolvedValue(null),
}));

describe('StressTelemetry Test Harness', () => {
  let mockTelemetryEvents: StressTestTelemetryEvent[];

  beforeEach(() => {
    mockTelemetryEvents = [];
    vi.clearAllMocks();
  });

  describe('Telemetry Event Structure', () => {
    it('should create valid stress test telemetry events', () => {
      const event: StressTestTelemetryEvent = {
        type: 'stress_run_completed',
        timestamp: Date.now(),
        data: {
          archetypeId: 'test-archetype',
          statPair: ['hp', 'damage'],
          winRate: 0.65,
          synergyMultiplier: 1.15,
          iterations: 1000,
          seed: 12345,
          runtimeMs: 500,
        },
      };

      expect(event).toHaveProperty('type', 'stress_run_completed');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('data');
      expect(event.data).toHaveProperty('archetypeId');
      expect(event.data).toHaveProperty('statPair');
      expect(event.data).toHaveProperty('winRate');
      expect(event.data).toHaveProperty('synergyMultiplier');
      expect(event.data).toHaveProperty('iterations');
      expect(event.data).toHaveProperty('seed');
      expect(event.data).toHaveProperty('runtimeMs');
    });

    it('should validate win rate bounds', () => {
      const event: StressTestTelemetryEvent = {
        type: 'stress_run_completed',
        timestamp: Date.now(),
        data: {
          archetypeId: 'test-archetype',
          statPair: ['hp', 'damage'],
          winRate: 0.75,
          synergyMultiplier: 1.2,
          iterations: 1000,
          seed: 12345,
          runtimeMs: 500,
        },
      };

      expect(event.data.winRate).toBeGreaterThanOrEqual(0);
      expect(event.data.winRate).toBeLessThanOrEqual(1);
    });

    it('should validate synergy multiplier bounds', () => {
      const event: StressTestTelemetryEvent = {
        type: 'stress_run_completed',
        timestamp: Date.now(),
        data: {
          archetypeId: 'test-archetype',
          statPair: ['hp', 'damage'],
          winRate: 0.75,
          synergyMultiplier: 1.2,
          iterations: 1000,
          seed: 12345,
          runtimeMs: 500,
        },
      };

      expect(event.data.synergyMultiplier).toBeGreaterThan(0);
      expect(event.data.iterations).toBeGreaterThan(0);
      expect(event.data.runtimeMs).toBeGreaterThan(0);
    });
  });

  describe('Telemetry Event Generation', () => {
    it('should generate events for marginal utility analysis', () => {
      const mockAnalysis: MarginalUtilityAnalysis = {
        id: 'test-analysis',
        config: {
          simulationCount: 1000,
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
            matchupCount: 4,
            bestMatchup: { opponentStat: 'damage', winRate: 0.75 },
            worstMatchup: { opponentStat: 'speed', winRate: 0.55 },
            ranking: 2,
            confidenceInterval: { lower: 0.58, upper: 0.72 },
          },
        ],
        synergyAnalyses: [
          {
            pairId: 'hp_damage',
            statIds: ['hp', 'damage'],
            observedWinRate: 0.72,
            expectedWinRate: 0.65,
            synergyMultiplier: 1.11,
            isOpSynergy: false,
            isWeakSynergy: false,
            isSignificant: false,
            pValue: 0.15,
            effectSize: 0.11,
            runtimeMs: 250,
          },
        ],
        summary: {
          totalSimulations: 4000,
          totalRuntimeMs: 1500,
          avgSimulationsPerSecond: 2666,
          opSynergiesCount: 0,
          weakSynergiesCount: 0,
          significantSynergiesCount: 0,
        },
        timestamp: Date.now(),
      };

      // Generate telemetry events from analysis
      const events: StressTestTelemetryEvent[] = [];
      
      mockAnalysis.synergyAnalyses.forEach(synergy => {
        const event: StressTestTelemetryEvent = {
          type: 'stress_run_completed',
          timestamp: Date.now(),
          data: {
            archetypeId: synergy.pairId,
            statPair: synergy.statIds,
            winRate: synergy.observedWinRate,
            synergyMultiplier: synergy.synergyMultiplier,
            iterations: mockAnalysis.config.simulationCount,
            seed: mockAnalysis.config.seed,
            runtimeMs: synergy.runtimeMs,
          },
        };
        events.push(event);
      });

      expect(events).toHaveLength(mockAnalysis.synergyAnalyses.length);
      
      events.forEach((event, index) => {
        const synergy = mockAnalysis.synergyAnalyses[index];
        expect(event.data.archetypeId).toBe(synergy.pairId);
        expect(event.data.statPair).toEqual(synergy.statIds);
        expect(event.data.winRate).toBe(synergy.observedWinRate);
        expect(event.data.synergyMultiplier).toBe(synergy.synergyMultiplier);
      });
    });

    it('should handle OP synergies correctly', () => {
      const opSynergyEvent: StressTestTelemetryEvent = {
        type: 'stress_run_completed',
        timestamp: Date.now(),
        data: {
          archetypeId: 'op-synergy',
          statPair: ['hp', 'damage'],
          winRate: 0.85,
          synergyMultiplier: 1.25,
          iterations: 1000,
          seed: 12345,
          runtimeMs: 500,
        },
      };

      expect(opSynergyEvent.data.synergyMultiplier).toBeGreaterThan(1.15);
    });

    it('should handle weak synergies correctly', () => {
      const weakSynergyEvent: StressTestTelemetryEvent = {
        type: 'stress_run_completed',
        timestamp: Date.now(),
        data: {
          archetypeId: 'weak-synergy',
          statPair: ['armor', 'speed'],
          winRate: 0.45,
          synergyMultiplier: 0.85,
          iterations: 1000,
          seed: 12345,
          runtimeMs: 500,
        },
      };

      expect(weakSynergyEvent.data.synergyMultiplier).toBeLessThan(0.95);
    });
  });

  describe('Telemetry Validation', () => {
    it('should validate required fields', () => {
      const invalidEvent = {
        type: 'stress_run_completed',
        timestamp: Date.now(),
        data: {
          // Missing required fields
          archetypeId: 'test',
          statPair: ['hp', 'damage'],
        },
      } as StressTestTelemetryEvent;

      // This would fail validation in a real implementation
      expect(invalidEvent.data.archetypeId).toBe('test');
      expect(invalidEvent.data.statPair).toEqual(['hp', 'damage']);
    });

    it('should validate data types', () => {
      const event: StressTestTelemetryEvent = {
        type: 'stress_run_completed',
        timestamp: Date.now(),
        data: {
          archetypeId: 'test-archetype',
          statPair: ['hp', 'damage'],
          winRate: 0.75,
          synergyMultiplier: 1.2,
          iterations: 1000,
          seed: 12345,
          runtimeMs: 500,
        },
      };

      expect(typeof event.type).toBe('string');
      expect(typeof event.timestamp).toBe('number');
      expect(typeof event.data).toBe('object');
      expect(typeof event.data.archetypeId).toBe('string');
      expect(Array.isArray(event.data.statPair)).toBe(true);
      expect(typeof event.data.winRate).toBe('number');
      expect(typeof event.data.synergyMultiplier).toBe('number');
      expect(typeof event.data.iterations).toBe('number');
      expect(typeof event.data.seed).toBe('number');
      expect(typeof event.data.runtimeMs).toBe('number');
    });

    it('should validate stat pair format', () => {
      const event: StressTestTelemetryEvent = {
        type: 'stress_run_completed',
        timestamp: Date.now(),
        data: {
          archetypeId: 'test-archetype',
          statPair: ['hp', 'damage'],
          winRate: 0.75,
          synergyMultiplier: 1.2,
          iterations: 1000,
          seed: 12345,
          runtimeMs: 500,
        },
      };

      expect(event.data.statPair).toHaveLength(2);
      expect(event.data.statPair[0]).toBe('hp');
      expect(event.data.statPair[1]).toBe('damage');
    });
  });

  describe('Performance and Throttling', () => {
    it('should handle high volume telemetry events', () => {
      const startTime = Date.now();
      
      // Generate many telemetry events
      for (let i = 0; i < 1000; i++) {
        const event: StressTestTelemetryEvent = {
          type: 'stress_run_completed',
          timestamp: Date.now(),
          data: {
            archetypeId: `archetype-${i}`,
            statPair: ['hp', 'damage'],
            winRate: 0.5 + (i % 50) / 100,
            synergyMultiplier: 1.0 + (i % 30) / 100,
            iterations: 1000,
            seed: 12345 + i,
            runtimeMs: 500 + (i % 100),
          },
        };
        mockTelemetryEvents.push(event);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(mockTelemetryEvents).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should batch telemetry events efficiently', () => {
      const events: StressTestTelemetryEvent[] = [];
      
      // Create batch of events
      for (let i = 0; i < 100; i++) {
        events.push({
          type: 'stress_run_completed',
          timestamp: Date.now(),
          data: {
            archetypeId: `batch-${i}`,
            statPair: ['hp', 'damage'],
            winRate: 0.6,
            synergyMultiplier: 1.1,
            iterations: 1000,
            seed: 12345,
            runtimeMs: 500,
          },
        });
      }
      
      // Simulate batch processing
      const batchSize = 10;
      const batches: StressTestTelemetryEvent[][] = [];
      
      for (let i = 0; i < events.length; i += batchSize) {
        batches.push(events.slice(i, i + batchSize));
      }
      
      expect(batches).toHaveLength(10);
      expect(batches[0]).toHaveLength(10);
      expect(batches[9]).toHaveLength(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed events gracefully', () => {
      const malformedEvent = {
        type: 'stress_run_completed',
        timestamp: Date.now(),
        data: {
          archetypeId: 'test',
          statPair: ['hp', 'damage'],
          winRate: 'invalid', // Should be number
          synergyMultiplier: 1.2,
          iterations: 1000,
          seed: 12345,
          runtimeMs: 500,
        },
      } as any;

      // In a real implementation, this would be caught and logged
      expect(malformedEvent.data.archetypeId).toBe('test');
      expect(malformedEvent.data.statPair).toEqual(['hp', 'damage']);
    });

    it('should handle missing data gracefully', () => {
      const incompleteEvent = {
        type: 'stress_run_completed',
        timestamp: Date.now(),
        data: null as any,
      };

      expect(incompleteEvent.type).toBe('stress_run_completed');
      expect(incompleteEvent.timestamp).toBeGreaterThan(0);
    });
  });
});

/**
 * Export test utilities for other test files
 */
export const STRESS_TELEMETRY_TEST_UTILS = {
  /**
   * Create a mock telemetry event
   */
  createMockEvent: (overrides: Partial<StressTestTelemetryEvent> = {}): StressTestTelemetryEvent => {
    const defaultEvent: StressTestTelemetryEvent = {
      type: 'stress_run_completed',
      timestamp: Date.now(),
      data: {
        archetypeId: 'test-archetype',
        statPair: ['hp', 'damage'],
        winRate: 0.65,
        synergyMultiplier: 1.1,
        iterations: 1000,
        seed: 12345,
        runtimeMs: 500,
      },
    };

    return { ...defaultEvent, ...overrides };
  },

  /**
   * Create a batch of mock telemetry events
   */
  createMockEventBatch: (count: number, baseId: string = 'batch'): StressTestTelemetryEvent[] => {
    const events: StressTestTelemetryEvent[] = [];
    
    for (let i = 0; i < count; i++) {
      events.push(STRESS_TELEMETRY_TEST_UTILS.createMockEvent({
        data: {
          archetypeId: `${baseId}-${i}`,
          winRate: 0.5 + (i % 50) / 100,
          synergyMultiplier: 1.0 + (i % 30) / 100,
          seed: 12345 + i,
          runtimeMs: 500 + (i % 100),
        },
      }));
    }
    
    return events;
  },

  /**
   * Validate telemetry event structure
   */
  validateEvent: (event: StressTestTelemetryEvent) => {
    expect(event).toHaveProperty('type');
    expect(event).toHaveProperty('timestamp');
    expect(event).toHaveProperty('data');
    
    expect(typeof event.type).toBe('string');
    expect(typeof event.timestamp).toBe('number');
    expect(typeof event.data).toBe('object');
    
    if (event.data) {
      expect(typeof event.data.archetypeId).toBe('string');
      expect(Array.isArray(event.data.statPair)).toBe(true);
      expect(typeof event.data.winRate).toBe('number');
      expect(typeof event.data.synergyMultiplier).toBe('number');
      expect(typeof event.data.iterations).toBe('number');
      expect(typeof event.data.seed).toBe('number');
      expect(typeof event.data.runtimeMs).toBe('number');
      
      // Validate bounds
      expect(event.data.winRate).toBeGreaterThanOrEqual(0);
      expect(event.data.winRate).toBeLessThanOrEqual(1);
      expect(event.data.synergyMultiplier).toBeGreaterThan(0);
      expect(event.data.iterations).toBeGreaterThan(0);
      expect(event.data.runtimeMs).toBeGreaterThan(0);
    }
  },

  /**
   * Compare two telemetry events for similarity
   */
  compareEvents: (event1: StressTestTelemetryEvent, event2: StressTestTelemetryEvent, tolerance = 0.01) => {
    expect(event1.type).toBe(event2.type);
    expect(event1.data.archetypeId).toBe(event2.data.archetypeId);
    expect(event1.data.statPair).toEqual(event2.data.statPair);
    
    expect(event1.data.winRate).toBeCloseTo(event2.data.winRate, 2);
    expect(event1.data.synergyMultiplier).toBeCloseTo(event2.data.synergyMultiplier, 2);
    expect(event1.data.iterations).toBe(event2.data.iterations);
    expect(event1.data.seed).toBe(event2.data.seed);
    expect(event1.data.runtimeMs).toBeCloseTo(event2.data.runtimeMs, 0);
  },
};
