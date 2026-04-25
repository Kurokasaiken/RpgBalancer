/**
 * Phase 10 Telemetry Router Tests - NP-057
 * 
 * Unit tests for the Phase 10 telemetry router functionality.
 * Tests event validation, routing, collectors, and error handling.
 * 
 * @since 2026-01-20
 * @author Vector-Balancer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  Phase10TelemetryRouter,
  FormulaSafetyCollector,
  UndoRedoCollector,
  StressTestingCollector,
  initializeDefaultCollectors,
  type Phase10Event,
  type FormulaSafetyEvent,
  type UndoRedoEvent,
  type StressTestingEvent,
  type EventCollector
} from '../../../src/balancing/telemetry/Phase10TelemetryRouter';

// Mock dependencies
vi.mock('../../../src/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

// Mock data
const mockFormulaSafetyEvent: FormulaSafetyEvent = {
  eventType: 'formula_safety',
  timestamp: '2023-01-19T12:00:00.000Z',
  sessionId: 'test-session-1',
  formulaId: 'formula-1',
  formula: 'strength * 1.2 + stamina * 0.8',
  validation: {
    valid: true,
    usedStats: ['strength', 'stamina'],
    warnings: [],
    safety: {
      hasCycles: false,
      complexity: 'low',
      estimatedOperations: 2,
      divisionRisk: false,
      rangeIssues: [],
    },
  },
  context: {
    stats: {
      strength: { min: 1, max: 100, current: 10 },
      stamina: { min: 1, max: 200, current: 50 },
    },
    maxOperations: 100,
    allowNegative: false,
  },
  metadata: {
    test: true,
  },
};

const mockUndoRedoEvent: UndoRedoEvent = {
  eventType: 'undo_redo',
  timestamp: '2023-01-19T12:00:00.000Z',
  sessionId: 'test-session-1',
  operation: 'undo',
  snapshotId: 'snapshot-1',
  beforeState: {
    configId: 'config-1',
    version: '1.0.0',
    checksum: 'abc123',
    timestamp: '2023-01-19T11:00:00.000Z',
  },
  afterState: {
    configId: 'config-1',
    version: '1.0.0',
    checksum: 'def456',
    timestamp: '2023-01-19T12:00:00.000Z',
  },
  historySize: 5,
  operationDuration: 150,
  metadata: {
    test: true,
  },
};

const mockStressTestingEvent: StressTestingEvent = {
  eventType: 'stress_testing',
  timestamp: '2023-01-19T12:00:00.000Z',
  sessionId: 'test-session-1',
  testType: 'archetype_generation',
  testId: 'test-1',
  parameters: {
    iterations: 1000,
    seed: 12345,
  },
  results: {
    success: true,
    duration: 5000,
    iterations: 1000,
    dataPoints: 500,
    metrics: {
      averageScore: 75.5,
      maxScore: 95.0,
      minScore: 45.0,
    },
    errors: [],
    warnings: ['Some warning'],
  },
  environment: {
    nodeVersion: '20.0.0',
    platform: 'linux',
    memory: 1024 * 1024 * 512, // 512MB
    cpu: 4,
  },
  metadata: {
    test: true,
  },
};

// Mock collector for testing
class MockCollector implements EventCollector {
  name = 'mock-collector';
  collectedEvents: Phase10Event[] = [];
  shouldValidate = true;
  shouldCollect = true;
  shouldThrow = false;

  collect(event: Phase10Event): Promise<boolean> {
    if (this.shouldThrow) {
      throw new Error('Mock collector error');
    }
    
    if (!this.shouldCollect) {
      return Promise.resolve(false);
    }
    
    this.collectedEvents.push(event);
    return Promise.resolve(true);
  }

  validate(event: Phase10Event): boolean {
    return this.shouldValidate;
  }

  reset(): void {
    this.collectedEvents = [];
  }

  setShouldValidate(shouldValidate: boolean): void {
    this.shouldValidate = shouldValidate;
  }

  setShouldCollect(shouldCollect: boolean): void {
    this.shouldCollect = shouldCollect;
  }

  setShouldThrow(shouldThrow: boolean): void {
    this.shouldThrow = shouldThrow;
  }
}

describe('Phase10TelemetryRouter', () => {
  let mockCollector: MockCollector;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollector = new MockCollector();
    Phase10TelemetryRouter.registerCollector(mockCollector);
    Phase10TelemetryRouter.configure({
      enableConsoleLogging: false,
      enablePersistence: false,
      enableTelemetry: false,
      maxQueueSize: 100,
      fallbackTimeout: 1000,
      retryAttempts: 2,
    });
  });

  afterEach(() => {
    Phase10TelemetryRouter.shutdown();
    Phase10TelemetryRouter.clearQueue();
  });

  describe('Event Validation', () => {
    it('should validate formula safety event', () => {
      const result = Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      
      expect(result.success).toBe(true);
      expect(result.routed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.collector).toBe('mock-collector');
    });

    it('should validate undo/redo event', () => {
      const result = Phase10TelemetryRouter.routeEvent(mockUndoRedoEvent);
      
      expect(result.success).toBe(true);
      expect(result.routed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.collector).toBe('mock-collector');
    });

    it('should validate stress testing event', () => {
      const result = Phase10TelemetryRouter.routeEvent(mockStressTestingEvent);
      
      expect(result.success).toBe(true);
      expect(result.routed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.collector).toBe('mock-collector');
    });

    it('should reject invalid event type', () => {
      const invalidEvent = {
        eventType: 'invalid_type',
        timestamp: '2023-01-19T12:00:00.000Z',
        sessionId: 'test-session-1',
      } as any;
      
      const result = Phase10TelemetryRouter.routeEvent(invalidEvent);
      
      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Unknown event type');
    });

    it('should reject event without timestamp', () => {
      const invalidEvent = {
        ...mockFormulaSafetyEvent,
        timestamp: '',
      };
      
      const result = Phase10TelemetryRouter.routeEvent(invalidEvent);
      
      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.errors).toContain('Missing required field: timestamp');
    });

    it('should reject event with invalid schema', () => {
      const invalidEvent = {
        eventType: 'formula_safety',
        timestamp: '2023-01-19T12:00:00.000Z',
        sessionId: 'test-session-1',
        // Missing required fields
      } as any;
      
      const result = Phase10TelemetryRouter.routeEvent(invalidEvent);
      
      expect(result.success).toBe(false);
      expect(result.routed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Event Normalization', () => {
    it('should normalize timestamp from number to string', () => {
      const event = {
        ...mockFormulaSafetyEvent,
        timestamp: Date.now() as any,
      };
      
      const result = Phase10TelemetryRouter.routeEvent(event);
      
      expect(result.success).toBe(true);
      expect(mockCollector.collectedEvents).toHaveLength(1);
      expect(mockCollector.collectedEvents[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should add session ID if missing', () => {
      const event = {
        ...mockFormulaSafetyEvent,
        sessionId: '',
      };
      
      const result = Phase10TelemetryRouter.routeEvent(event);
      
      expect(result.success).toBe(true);
      expect(mockCollector.collectedEvents).toHaveLength(1);
      expect(mockCollector.collectedEvents[0].sessionId).toMatch(/^session_\d+_/);
    });

    it('should add metadata if missing', () => {
      const event = {
        ...mockFormulaSafetyEvent,
        metadata: undefined,
      };
      
      const result = Phase10TelemetryRouter.routeEvent(event);
      
      expect(result.success).toBe(true);
      expect(mockCollector.collectedEvents).toHaveLength(1);
      expect(mockCollector.collectedEvents[0].metadata).toBeDefined();
      expect(mockCollector.collectedEvents[0].metadata.processedAt).toBeDefined();
      expect(mockCollector.collectedEvents[0].metadata.routerVersion).toBe('1.0.0');
    });
  });

  describe('Event Routing', () => {
    it('should route to applicable collectors', () => {
      const collector2 = new MockCollector();
      collector2.name = 'mock-collector-2';
      Phase10TelemetryRouter.registerCollector(collector2);
      
      const result = Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      
      expect(result.success).toBe(true);
      expect(result.routed).toBe(true);
      expect(result.collector).toBe('mock-collector, mock-collector-2');
      expect(mockCollector.collectedEvents).toHaveLength(1);
      expect(collector2.collectedEvents).toHaveLength(1);
    });

    it('should skip collectors that fail validation', () => {
      const collector2 = new MockCollector();
      collector2.name = 'mock-collector-2';
      collector2.setShouldValidate(false);
      Phase10TelemetryRouter.registerCollector(collector2);
      
      const result = Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      
      expect(result.success).toBe(true);
      expect(result.routed).toBe(true);
      expect(result.collector).toBe('mock-collector');
      expect(mockCollector.collectedEvents).toHaveLength(1);
      expect(collector2.collectedEvents).toHaveLength(0);
    });

    it('should handle collector collection failures', () => {
      const collector2 = new MockCollector();
      collector2.name = 'mock-collector-2';
      collector2.setShouldCollect(false);
      Phase10TelemetryRouter.registerCollector(collector2);
      
      const result = Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      
      expect(result.success).toBe(false);
      expect(result.routed).toBe(true);
      expect(result.errors).toContain('Collection failed for mock-collector-2');
    });

    it('should handle collector errors', () => {
      const collector2 = new MockCollector();
      collector2.name = 'mock-collector-2';
      collector2.setShouldThrow(true);
      Phase10TelemetryRouter.registerCollector(collector2);
      
      const result = Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      
      expect(result.success).toBe(false);
      expect(result.routed).toBe(true);
      expect(result.errors[0]).toContain('Error in mock-collector-2');
    });

    it('should queue events when no collectors available', () => {
      Phase10TelemetryRouter.unregisterCollector('mock-collector');
      
      const result = Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      
      expect(result.success).toBe(true);
      expect(result.routed).toBe(false);
      expect(result.errors).toContain('No collectors available, event queued for retry');
      expect(result.collector).toBe('queue');
    });
  });

  describe('Event Queue', () => {
    it('should queue events when processing', async () => {
      // Simulate processing
      const collector2 = new MockCollector();
      collector2.name = 'mock-collector-2';
      collector2.setShouldCollect(false); // Will fail collection
      Phase10TelemetryRouter.registerCollector(collector2);
      
      // Route first event (should be queued)
      const result1 = Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      
      expect(result1.success).toBe(true);
      expect(result1.routed).toBe(false);
      
      // Check queue size
      const stats = Phase10TelemetryRouter.getStatistics();
      expect(stats.queueSize).toBe(1);
    });

    it('should respect max queue size', () => {
      Phase10TelemetryRouter.configure({
        enableConsoleLogging: false,
        enablePersistence: false,
        enableTelemetry: false,
        maxQueueSize: 2,
        fallbackTimeout: 1000,
        retryAttempts: 2,
      });
      
      Phase10TelemetryRouter.unregisterCollector('mock-collector');
      
      // Add events to queue
      Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      Phase10TelemetryRouter.routeEvent(mockUndoRedoEvent);
      Phase10TelemetryRouter.routeEvent(mockStressTestingEvent); // Should drop oldest
      
      const stats = Phase10TelemetryRouter.getStatistics();
      expect(stats.queueSize).toBe(2);
    });

    it('should clear queue', () => {
      Phase10TelemetryRouter.unregisterCollector('mock-collector');
      
      // Add events to queue
      Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      Phase10TelemetryRouter.routeEvent(mockUndoRedoEvent);
      
      const cleared = Phase10TelemetryRouter.clearQueue();
      
      expect(cleared).toBe(2);
      
      const stats = Phase10TelemetryRouter.getStatistics();
      expect(stats.queueSize).toBe(0);
    });
  });

  describe('Collector Management', () => {
    it('should register collector', () => {
      const collector = new MockCollector();
      collector.name = 'test-collector';
      
      Phase10TelemetryRouter.registerCollector(collector);
      
      const collectors = Phase10TelemetryRouter.getCollectors();
      expect(collectors).toContain('test-collector');
      expect(collectors).toContain('mock-collector');
    });

    it('should unregister collector', () => {
      Phase10TelemetryRouter.unregisterCollector('mock-collector');
      
      const collectors = Phase10TelemetryRouter.getCollectors();
      expect(collectors).not.toContain('mock-collector');
    });

    it('should get registered collectors', () => {
      const collectors = Phase10TelemetryRouter.getCollectors();
      expect(collectors).toContain('mock-collector');
      expect(Array.isArray(collectors)).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should configure router', () => {
      Phase10TelemetryRouter.configure({
        enableConsoleLogging: true,
        enablePersistence: true,
        enableTelemetry: true,
        maxQueueSize: 500,
        fallbackTimeout: 2000,
        retryAttempts: 5,
      });
      
      const stats = Phase10TelemetryRouter.getStatistics();
      expect(stats.config.maxQueueSize).toBe(500);
      expect(stats.config.fallbackTimeout).toBe(2000);
      expect(stats.config.retryAttempts).toBe(5);
    });
  });

  describe('Statistics', () => {
    it('should get router statistics', () => {
      const stats = Phase10TelemetryRouter.getStatistics();
      
      expect(stats).toHaveProperty('config');
      expect(stats).toHaveProperty('collectorsCount');
      expect(stats).toHaveProperty('queueSize');
      expect(stats).toHaveProperty('isProcessing');
      expect(stats).toHaveProperty('registeredCollectors');
      
      expect(stats.collectorsCount).toBe(1);
      expect(stats.queueSize).toBe(0);
      expect(stats.isProcessing).toBe(false);
      expect(stats.registeredCollectors).toContain('mock-collector');
    });
  });

  describe('Health Status', () => {
    it('should get health status', () => {
      const health = Phase10TelemetryRouter.getHealthStatus();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('queueSize');
      expect(health).toHaveProperty('collectorsCount');
      expect(health).toHaveProperty('config');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('memory');
      
      expect(health.status).toBe('idle');
      expect(health.queueSize).toBe(0);
      expect(health.collectorsCount).toBe(1);
      expect(typeof health.uptime).toBe('number');
      expect(typeof health.memory).toBe('object');
    });
  });

  describe('Shutdown', () => {
    it('should shutdown router', () => {
      Phase10TelemetryRouter.shutdown();
      
      const stats = Phase10TelemetryRouter.getStatistics();
      expect(stats.collectorsCount).toBe(0);
      expect(stats.queueSize).toBe(0);
    });
  });

  describe('Default Collectors', () => {
    it('should initialize default collectors', () => {
      Phase10TelemetryRouter.shutdown();
      initializeDefaultCollectors();
      
      const collectors = Phase10TelemetryRouter.getCollectors();
      expect(collectors).toContain('formula_safety');
      expect(collectors).toContain('undo_redo');
      expect(collectors).toContain('stress_testing');
    });

    it('should register formula safety collector', () => {
      const collector = new FormulaSafetyCollector();
      expect(collector.name).toBe('formula_safety');
      expect(collector.validate(mockFormulaSafetyEvent)).toBe(true);
      expect(collector.validate(mockUndoRedoEvent)).toBe(false);
    });

    it('should register undo/redo collector', () => {
      const collector = new UndoRedoCollector();
      expect(collector.name).toBe('undo_redo');
      expect(collector.validate(mockUndoRedoEvent)).toBe(true);
      expect(collector.validate(mockFormulaSafetyEvent)).toBe(false);
    });

    it('should register stress testing collector', () => {
      const collector = new StressTestingCollector();
      expect(collector.name).toBe('stress_testing');
      expect(collector.validate(mockStressTestingEvent)).toBe(true);
      expect(collector.validate(mockFormulaSafetyEvent)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed events gracefully', () => {
      const malformedEvent = {
        eventType: 'formula_safety',
        timestamp: 'invalid-date',
        sessionId: 'test-session',
        // Missing required fields
      } as any;
      
      const result = Phase10TelemetryRouter.routeEvent(malformedEvent);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle collector errors gracefully', () => {
      const collector2 = new MockCollector();
      collector2.name = 'error-collector';
      collector2.setShouldThrow(true);
      Phase10TelemetryRouter.registerCollector(collector2);
      
      const result = Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Error in error-collector');
    });

    it('should handle queue overflow gracefully', () => {
      Phase10TelemetryRouter.configure({
        enableConsoleLogging: false,
        enablePersistence: false,
        enableTelemetry: false,
        maxQueueSize: 1,
        fallbackTimeout: 1000,
        retryAttempts: 2,
      });
      
      Phase10TelemetryRouter.unregisterCollector('mock-collector');
      
      // Add events to fill queue
      Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      Phase10TelemetryRouter.routeEvent(mockUndoRedoEvent); // Should drop first
      
      const stats = Phase10TelemetryRouter.getStatistics();
      expect(stats.queueSize).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should handle multiple events efficiently', async () => {
      const events = Array(100).fill(null).map((_, index) => ({
        ...mockFormulaSafetyEvent,
        sessionId: `test-session-${index}`,
      }));
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        events.map(event => Phase10TelemetryRouter.routeEvent(event))
      );
      
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(100);
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle concurrent operations', async () => {
      const promises = Array(10).fill(null).map(() => 
        Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockCollector.collectedEvents).toHaveLength(10);
    });
  });

  describe('Telemetry Events', () => {
    it('should emit telemetry events when enabled', async () => {
      const { saveData } = await import('../../../src/shared/persistence/PersistenceService');
      vi.mocked(saveData);
      
      Phase10TelemetryRouter.configure({
        enableConsoleLogging: false,
        enablePersistence: false,
        enableTelemetry: true,
        maxQueueSize: 100,
        fallbackTimeout: 1000,
        retryAttempts: 2,
      });
      
      const result = await Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
      
      expect(result.success).toBe(true);
      expect(saveData).toHaveBeenCalledWith(
        expect.stringMatching(/^telemetry_balancer_phase10_\d+$/),
        expect.objectContaining({
          event: 'balancer_phase10_event_routed',
          data: expect.objectContaining({
            originalEvent: mockFormulaSafetyEvent,
            routingResults: expect.any(Array),
          }),
        })
      );
    });
  });
});

describe('Phase10TelemetryRouter Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Phase10TelemetryRouter.configure({
      enableConsoleLogging: false,
      enablePersistence: false,
      enableTelemetry: false,
      maxQueueSize: 100,
      fallbackTimeout: 1000,
      retryAttempts: 2,
    });
    initializeDefaultCollectors();
  });

  afterEach(() => {
    Phase10TelemetryRouter.shutdown();
    Phase10TelemetryRouter.clearQueue();
  });

  it('should route formula safety events to formula safety collector', async () => {
    const result = await Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent);
    
    expect(result.success).toBe(true);
    expect(result.routed).toBe(true);
    expect(result.collector).toBe('formula_safety');
  });

  it('should route undo/redo events to undo/redo collector', async () => {
    const result = await Phase10TelemetryRouter.routeEvent(mockUndoRedoEvent);
    
    expect(result.success).toBe(true);
    expect(result.routed).toBe(true);
    expect(result.collector).toBe('undo_redo');
  });

  it('should route stress testing events to stress testing collector', async () => {
    const result = await Phase10TelemetryRouter.routeEvent(mockStressTestingEvent);
    
    expect(result.success).toBe(true);
    expect(result.routed).toBe(true);
    expect(result.collector).toBe('stress_testing');
  });

  it('should handle mixed event types', async () => {
    const results = await Promise.all([
      Phase10TelemetryRouter.routeEvent(mockFormulaSafetyEvent),
      Phase10TelemetryRouter.routeEvent(mockUndoRedoEvent),
      Phase10TelemetryRouter.routeEvent(mockStressTestingEvent),
    ]);
    
    expect(results).toHaveLength(3);
    expect(results[0].collector).toBe('formula_safety');
    expect(results[1].collector).toBe('undo_redo');
    expect(results[2].collector).toBe('stress_testing');
    expect(results.every(r => r.success)).toBe(true);
  });
});
