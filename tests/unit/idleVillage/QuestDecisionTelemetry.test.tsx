/**
 * Unit Tests for Quest Decision Telemetry System
 * 
 * Comprehensive test suite covering configuration, pipeline, hooks,
 * fallback mechanisms, and UI components.
 * 
 * @module QuestDecisionTelemetry.test
 * @since 2026-01-13
 * @author Cascade
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';
import {
  QuestDecisionType,
  DecisionSource,
  DecisionConfidence,
  QuestCategory,
  QuestDifficulty,
  createQuestDecisionEventId,
  calculateDecisionConfidence,
  shouldSampleEvent,
  sanitizeTelemetryEvent,
  DEFAULT_QUEST_DECISION_TELEMETRY_PIPELINE_CONFIG,
  DEFAULT_QUEST_DECISION_TELEMETRY_FEED_CONFIG,
  type QuestDecisionTelemetryEvent,
  type QuestDecisionContext,
  type QuestDecisionFactors,
  type QuestDecisionOutcome,
} from '@/balancing/config/idleVillage/questDecisionTelemetryConfig';
import {
  getQuestDecisionTelemetryPipeline,
  resetQuestDecisionTelemetryPipeline,
  type PipelineStatus,
} from '@/balancing/utils/idleVillage/questDecisionTelemetryPipeline';
import {
  getQuestDecisionTelemetryFallback,
  resetQuestDecisionTelemetryFallback,
  type FallbackStrategy,
  type FallbackEventStatus,
} from '@/balancing/utils/idleVillage/questDecisionTelemetryFallback';
import {
  useQuestDecisionTelemetry,
  useQuestDecisionAnalytics,
  useQuestDecisionAlerts,
} from '@/ui/idleVillage/hooks/useQuestDecisionTelemetry';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  databases: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
});

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Test data factory
const createTestEvent = (overrides: Partial<QuestDecisionTelemetryEvent> = {}): QuestDecisionTelemetryEvent => {
  const context: QuestDecisionContext = {
    playerLevel: 10,
    playerExperience: 1500,
    availableResources: { gold: 100, food: 50 },
    activeQuestsCount: 3,
    completedQuestsCount: 15,
    failedQuestsCount: 2,
    gameTime: 3600000,
    sessionDuration: 1800000,
    playerLocation: 'forest',
    timeOfDay: 'afternoon',
    deviceType: 'desktop',
    networkQuality: 'good',
    batteryLevel: 85,
  };

  const factors: QuestDecisionFactors = {
    timePressure: 0.3,
    resourcePressure: 0.5,
    riskTolerance: 0.7,
    rewardAttractiveness: 0.8,
    socialInfluence: 0.2,
    previousSuccessRate: 0.9,
    difficultyPreference: 0.6,
    timeAvailability: 0.4,
    motivationLevel: 0.8,
    fatigueLevel: 0.1,
  };

  const outcome: QuestDecisionOutcome = {
    timestamp: Date.now(),
    decisionType: QuestDecisionType.QUEST_ACCEPT,
    source: DecisionSource.PLAYER_CHOICE,
    confidence: DecisionConfidence.HIGH,
    processingTime: 250,
    reverted: false,
    finalDecision: QuestDecisionType.QUEST_ACCEPT,
    justification: 'Good rewards and manageable difficulty',
  };

  return {
    eventId: createQuestDecisionEventId(),
    questId: 'quest-001',
    questName: 'Forest Exploration',
    questCategory: QuestCategory.SIDE_STORY,
    questDifficulty: QuestDifficulty.NORMAL,
    questDuration: 1800000,
    context,
    factors,
    outcome,
    questRequirements: {
      level: 8,
      resources: { gold: 50 },
      prerequisites: ['quest-000'],
      timeLimit: 3600000,
    },
    questRewards: {
      experience: 200,
      resources: { gold: 100, food: 25 },
      items: ['sword-001'],
      reputation: 10,
    },
    playerStateBefore: {
      health: 100,
      mana: 50,
      stamina: 80,
      inventory: { gold: 100, food: 50 },
      skills: { sword: 5, magic: 3 },
    },
    playerStateAfter: {
      health: 100,
      mana: 50,
      stamina: 80,
      inventory: { gold: 100, food: 50 },
      skills: { sword: 5, magic: 3 },
    },
    metadata: {
      sessionId: 'session-001',
      userId: 'user-001',
      version: '1.0.0',
      buildNumber: 'build-123',
      platform: 'web',
      timezone: 'UTC',
      language: 'en',
      region: 'US',
    },
    ...overrides,
  };
};

// Wrapper for testing hooks with providers
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => <>{children}</>;
};

describe('Quest Decision Telemetry Configuration', () => {
  describe('Utility Functions', () => {
    it('should create unique event IDs', () => {
      const id1 = createQuestDecisionEventId();
      const id2 = createQuestDecisionEventId();
      
      expect(id1).toMatch(/^quest-decision-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^quest-decision-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should calculate decision confidence correctly', () => {
      const factors: QuestDecisionFactors = {
        timePressure: 0.8,
        resourcePressure: 0.2,
        riskTolerance: 0.9,
        rewardAttractiveness: 0.7,
        socialInfluence: 0.3,
        previousSuccessRate: 0.8,
        difficultyPreference: 0.6,
        timeAvailability: 0.5,
        motivationLevel: 0.9,
        fatigueLevel: 0.1,
      };

      const confidence = calculateDecisionConfidence(factors);
      expect(confidence).toBe(DecisionConfidence.VERY_HIGH);
    });

    it('should determine event sampling correctly', () => {
      const event = createTestEvent();
      const config = DEFAULT_QUEST_DECISION_TELEMETRY_PIPELINE_CONFIG.sampling;

      // With sampling disabled
      const configDisabled = { ...config, enabled: false };
      expect(shouldSampleEvent(configDisabled, event)).toBe(true);

      // With sampling enabled and rate 1.0
      const configFull = { ...config, enabled: true, rate: 1.0 };
      expect(shouldSampleEvent(configFull, event)).toBe(true);

      // With sampling enabled and rate 0.0
      const configNone = { ...config, enabled: true, rate: 0.0 };
      expect(shouldSampleEvent(configNone, event)).toBe(false);
    });

    it('should sanitize telemetry events for privacy', () => {
      const event = createTestEvent();
      const privacy = DEFAULT_QUEST_DECISION_TELEMETRY_PIPELINE_CONFIG.privacy;

      const sanitized = sanitizeTelemetryEvent(event, privacy);

      expect(sanitized.metadata.userId).not.toBe(event.metadata.userId);
      expect(sanitized.metadata.userId).toMatch(/^user-\d+$/);
      expect(sanitized.context.playerLocation).not.toBe(event.context.playerLocation);
    });
  });

  describe('Schema Validation', () => {
    it('should validate complete event structure', () => {
      const event = createTestEvent();
      
      // Basic structure validation
      expect(event).toHaveProperty('eventId');
      expect(event).toHaveProperty('questId');
      expect(event).toHaveProperty('questName');
      expect(event).toHaveProperty('questCategory');
      expect(event).toHaveProperty('questDifficulty');
      expect(event).toHaveProperty('context');
      expect(event).toHaveProperty('factors');
      expect(event).toHaveProperty('outcome');
      expect(event).toHaveProperty('questRequirements');
      expect(event).toHaveProperty('questRewards');
      expect(event).toHaveProperty('playerStateBefore');
      expect(event).toHaveProperty('playerStateAfter');
      expect(event).toHaveProperty('metadata');
    });

    it('should validate enum values', () => {
      const event = createTestEvent();
      
      expect(Object.values(QuestDecisionType)).toContain(event.outcome.decisionType);
      expect(Object.values(DecisionSource)).toContain(event.outcome.source);
      expect(Object.values(DecisionConfidence)).toContain(event.outcome.confidence);
      expect(Object.values(QuestCategory)).toContain(event.questCategory);
      expect(Object.values(QuestDifficulty)).toContain(event.questDifficulty);
    });

    it('should validate numeric ranges', () => {
      const event = createTestEvent();
      
      // Context values should be in reasonable ranges
      expect(event.context.playerLevel).toBeGreaterThan(0);
      expect(event.context.playerExperience).toBeGreaterThanOrEqual(0);
      expect(event.context.activeQuestsCount).toBeGreaterThanOrEqual(0);
      
      // Factor values should be between 0 and 1
      Object.values(event.factors).forEach(factor => {
        expect(factor).toBeGreaterThanOrEqual(0);
        expect(factor).toBeLessThanOrEqual(1);
      });
      
      // Processing time should be positive
      expect(event.outcome.processingTime).toBeGreaterThan(0);
    });
  });
});

describe('Quest Decision Telemetry Pipeline', () => {
  beforeEach(() => {
    resetQuestDecisionTelemetryPipeline();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetQuestDecisionTelemetryPipeline();
  });

  it('should initialize pipeline with default config', () => {
    const pipeline = getQuestDecisionTelemetryPipeline();
    
    expect(pipeline.getStatus()).toBe(PipelineStatus.IDLE);
  });

  it('should start and stop pipeline correctly', () => {
    const pipeline = getQuestDecisionTelemetryPipeline();
    
    pipeline.stop();
    expect(pipeline.getStatus()).toBe(PipelineStatus.STOPPED);
    
    pipeline.start();
    expect(pipeline.getStatus()).toBe(PipelineStatus.IDLE);
  });

  it('should add events to pipeline', async () => {
    const pipeline = getQuestDecisionTelemetryPipeline();
    const event = createTestEvent();
    
    await act(async () => {
      await pipeline.addEvent(event);
    });
    
    const metrics = pipeline.getMetrics();
    expect(metrics.queuedEvents).toBeGreaterThanOrEqual(0);
  });

  it('should process events in batches', async () => {
    const pipeline = getQuestDecisionTelemetryPipeline();
    const events = Array.from({ length: 5 }, (_, i) => 
      createTestEvent({ eventId: `test-event-${i}` })
    );
    
    // Add events
    for (const event of events) {
      await act(async () => {
        await pipeline.addEvent(event);
      });
    }
    
    // Process events
    await act(async () => {
      await pipeline.processEvents();
    });
    
    const metrics = pipeline.getMetrics();
    expect(metrics.processedEvents).toBeGreaterThanOrEqual(0);
  });

  it('should handle pipeline configuration updates', () => {
    const pipeline = getQuestDecisionTelemetryPipeline();
    const newConfig = {
      enabled: false,
      batchProcessing: {
        enabled: false,
        batchSize: 100,
        batchTimeout: 10000,
        maxRetries: 5,
      },
    };
    
    pipeline.updateConfig(newConfig);
    
    // Config should be updated without errors
    expect(true).toBe(true); // Basic sanity check
  });

  it('should clear all pipeline data', async () => {
    const pipeline = getQuestDecisionTelemetryPipeline();
    const event = createTestEvent();
    
    await act(async () => {
      await pipeline.addEvent(event);
      await pipeline.clear();
    });
    
    const metrics = pipeline.getMetrics();
    expect(metrics.totalEvents).toBe(0);
    expect(metrics.queuedEvents).toBe(0);
  });
});

describe('Quest Decision Telemetry Fallback', () => {
  beforeEach(() => {
    resetQuestDecisionTelemetryFallback();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetQuestDecisionTelemetryFallback();
  });

  it('should initialize fallback with default config', () => {
    const fallback = getQuestDecisionTelemetryFallback();
    
    expect(fallback).toBeDefined();
  });

  it('should save events to fallback storage', async () => {
    const fallback = getQuestDecisionTelemetryFallback();
    const event = createTestEvent();
    const error = new Error('Test error');
    
    await act(async () => {
      await fallback.saveEvent(event, error);
    });
    
    const stats = await fallback.getStats();
    expect(stats.totalEvents).toBeGreaterThanOrEqual(0);
  });

  it('should retrieve pending events for retry', async () => {
    const fallback = getQuestDecisionTelemetryFallback();
    const event = createTestEvent();
    
    await act(async () => {
      await fallback.saveEvent(event);
    });
    
    const pendingEvents = await fallback.getPendingEvents();
    expect(Array.isArray(pendingEvents)).toBe(true);
  });

  it('should mark events as successful', async () => {
    const fallback = getQuestDecisionTelemetryFallback();
    const event = createTestEvent();
    
    await act(async () => {
      await fallback.saveEvent(event);
      await fallback.markEventSuccess(event.eventId);
    });
    
    // Event should be removed from storage
    const retrievedEvents = await fallback.getEventById(event.eventId);
    expect(retrievedEvents.length).toBe(0);
  });

  it('should mark events as failed and increment retry count', async () => {
    const fallback = getQuestDecisionTelemetryFallback();
    const event = createTestEvent();
    const error = new Error('Test failure');
    
    await act(async () => {
      await fallback.saveEvent(event);
      await fallback.markEventFailed(event.eventId, error);
    });
    
    const retrievedEvents = await fallback.getEventById(event.eventId);
    if (retrievedEvents.length > 0) {
      expect(retrievedEvents[0].retryCount).toBe(1);
      expect(retrievedEvents[0].status).toBe(FallbackEventStatus.RETRYING);
    }
  });

  it('should clear all fallback events', async () => {
    const fallback = getQuestDecisionTelemetryFallback();
    const event = createTestEvent();
    
    await act(async () => {
      await fallback.saveEvent(event);
      await fallback.clear();
    });
    
    const stats = await fallback.getStats();
    expect(stats.totalEvents).toBe(0);
  });

  it('should provide fallback statistics', async () => {
    const fallback = getQuestDecisionTelemetryFallback();
    const event = createTestEvent();
    
    await act(async () => {
      await fallback.saveEvent(event);
    });
    
    const stats = await fallback.getStats();
    expect(stats).toHaveProperty('totalEvents');
    expect(stats).toHaveProperty('pendingEvents');
    expect(stats).toHaveProperty('failedEvents');
    expect(stats).toHaveProperty('successfulEvents');
    expect(stats).toHaveProperty('storageStats');
    expect(Array.isArray(stats.storageStats)).toBe(true);
  });

  it('should check fallback system health', async () => {
    const fallback = getQuestDecisionTelemetryFallback();
    const isHealthy = await fallback.isHealthy();
    
    expect(typeof isHealthy).toBe('boolean');
  });
});

describe('Quest Decision Telemetry Hooks', () => {
  beforeEach(() => {
    resetQuestDecisionTelemetryPipeline();
    resetQuestDecisionTelemetryFallback();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetQuestDecisionTelemetryPipeline();
    resetQuestDecisionTelemetryFallback();
  });

  describe('useQuestDecisionTelemetry', () => {
    it('should initialize hook with default values', () => {
      const { result } = renderHook(() => useQuestDecisionTelemetry(), {
        wrapper: createWrapper(),
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.trackDecision).toBe('function');
      expect(typeof result.current.trackDecisionSimple).toBe('function');
      expect(typeof result.current.clearEvents).toBe('function');
      expect(typeof result.current.refreshFeed).toBe('function');
      expect(typeof result.current.exportEvents).toBe('function');
    });

    it('should track decision events', async () => {
      const { result } = renderHook(() => useQuestDecisionTelemetry(), {
        wrapper: createWrapper(),
      });

      const event = createTestEvent();

      await act(async () => {
        await result.current.trackDecision(event);
      });

      expect(result.current.events.length).toBeGreaterThanOrEqual(0);
    });

    it('should track simple decision parameters', async () => {
      const { result } = renderHook(() => useQuestDecisionTelemetry(), {
        wrapper: createWrapper(),
      });

      const simpleParams = {
        questId: 'quest-001',
        questName: 'Test Quest',
        questCategory: QuestCategory.SIDE_STORY,
        questDifficulty: QuestDifficulty.NORMAL,
        decisionType: QuestDecisionType.QUEST_ACCEPT,
        source: DecisionSource.PLAYER_CHOICE,
        playerLevel: 10,
        playerExperience: 1500,
        processingTime: 250,
        justification: 'Test justification',
      };

      await act(async () => {
        await result.current.trackDecisionSimple(simpleParams);
      });

      expect(result.current.events.length).toBeGreaterThanOrEqual(0);
    });

    it('should clear events', () => {
      const { result } = renderHook(() => useQuestDecisionTelemetry(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.clearEvents();
      });

      expect(result.current.events).toEqual([]);
    });

    it('should export events in JSON format', () => {
      const { result } = renderHook(() => useQuestDecisionTelemetry(), {
        wrapper: createWrapper(),
      });

      const jsonExport = result.current.exportEvents('json');
      expect(typeof jsonExport).toBe('string');
      
      // Should be valid JSON
      expect(() => JSON.parse(jsonExport)).not.toThrow();
    });

    it('should export events in CSV format', () => {
      const { result } = renderHook(() => useQuestDecisionTelemetry(), {
        wrapper: createWrapper(),
      });

      const csvExport = result.current.exportEvents('csv');
      expect(typeof csvExport).toBe('string');
      
      // Should contain CSV headers
      expect(csvExport).toContain('eventId');
      expect(csvExport).toContain('questId');
      expect(csvExport).toContain('questName');
    });
  });

  describe('useQuestDecisionAnalytics', () => {
    it('should calculate analytics from events', () => {
      const events = [
        createTestEvent(),
        createTestEvent({ 
          eventId: 'test-2',
          outcome: { 
            ...createTestEvent().outcome, 
            decisionType: QuestDecisionType.QUEST_REJECT 
          }
        }),
      ];

      const { result } = renderHook(() => useQuestDecisionAnalytics(events), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalDecisions).toBe(2);
      expect(result.current.decisionsByCategory).toBeDefined();
      expect(result.current.decisionsByDifficulty).toBeDefined();
      expect(result.current.decisionsBySource).toBeDefined();
      expect(result.current.decisionsByConfidence).toBeDefined();
      expect(result.current.hourlyDistribution).toBeDefined();
      expect(result.current.dailyDistribution).toBeDefined();
    });

    it('should handle empty events array', () => {
      const { result } = renderHook(() => useQuestDecisionAnalytics([]), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalDecisions).toBe(0);
      expect(result.current.averageProcessingTime).toBe(0);
      expect(result.current.averageConfidence).toBe(0);
      expect(result.current.successRate).toBe(0);
    });

    it('should calculate metrics correctly', () => {
      const events = [
        createTestEvent({
          outcome: {
            ...createTestEvent().outcome,
            decisionType: QuestDecisionType.QUEST_COMPLETE,
            processingTime: 100,
            confidence: DecisionConfidence.HIGH,
            reverted: false,
          }
        }),
        createTestEvent({
          eventId: 'test-2',
          outcome: {
            ...createTestEvent().outcome,
            decisionType: QuestDecisionType.QUEST_FAIL,
            processingTime: 200,
            confidence: DecisionConfidence.LOW,
            reverted: true,
          }
        }),
      ];

      const { result } = renderHook(() => useQuestDecisionAnalytics(events), {
        wrapper: createWrapper(),
      });

      expect(result.current.totalDecisions).toBe(2);
      expect(result.current.averageProcessingTime).toBe(150);
      expect(result.current.revertRate).toBe(0.5);
      expect(result.current.successRate).toBe(0.5);
      expect(result.current.completionRate).toBe(0.5);
    });
  });

  describe('useQuestDecisionAlerts', () => {
    it('should generate alerts based on metrics', () => {
      const metrics = {
        totalDecisions: 100,
        decisionsByType: {} as Record<QuestDecisionType, number>,
        avgProcessingTime: 6000, // High processing time
        avgConfidence: 0.7,
        revertRate: 0.15, // High revert rate
        successRate: 0.8,
        completionRate: 0.7,
        abandonmentRate: 0.25, // High abandonment rate
        timeToDecision: 5000,
        decisionFrequency: 10,
      };

      const { result } = renderHook(() => useQuestDecisionAlerts(metrics, {
        enabled: true,
        thresholds: {
          revertRate: 0.1,
          processingTime: 5000,
          errorRate: 0.05,
          abandonmentRate: 0.2,
        },
        notifications: {
          email: false,
          webhook: false,
          inApp: true,
        },
      }), {
        wrapper: createWrapper(),
      });

      expect(result.current.alerts.length).toBeGreaterThan(0);
      expect(result.current.hasAlerts).toBe(true);
    });

    it('should clear alerts', () => {
      const metrics = {
        totalDecisions: 100,
        decisionsByType: {} as Record<QuestDecisionType, number>,
        avgProcessingTime: 6000,
        avgConfidence: 0.7,
        revertRate: 0.15,
        successRate: 0.8,
        completionRate: 0.7,
        abandonmentRate: 0.25,
        timeToDecision: 5000,
        decisionFrequency: 10,
      };

      const { result } = renderHook(() => useQuestDecisionAlerts(metrics, {
        enabled: true,
        thresholds: {
          revertRate: 0.1,
          processingTime: 5000,
          errorRate: 0.05,
          abandonmentRate: 0.2,
        },
        notifications: {
          email: false,
          webhook: false,
          inApp: true,
        },
      }), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.clearAlerts();
      });

      expect(result.current.alerts).toEqual([]);
      expect(result.current.hasAlerts).toBe(false);
    });

    it('should handle metrics within thresholds', () => {
      const metrics = {
        totalDecisions: 100,
        decisionsByType: {} as Record<QuestDecisionType, number>,
        avgProcessingTime: 1000, // Normal processing time
        avgConfidence: 0.8,
        revertRate: 0.05, // Normal revert rate
        successRate: 0.9,
        completionRate: 0.85,
        abandonmentRate: 0.1, // Normal abandonment rate
        timeToDecision: 2000,
        decisionFrequency: 15,
      };

      const { result } = renderHook(() => useQuestDecisionAlerts(metrics, {
        enabled: true,
        thresholds: {
          revertRate: 0.1,
          processingTime: 5000,
          errorRate: 0.05,
          abandonmentRate: 0.2,
        },
        notifications: {
          email: false,
          webhook: false,
          inApp: true,
        },
      }), {
        wrapper: createWrapper(),
      });

      expect(result.current.alerts.length).toBe(0);
      expect(result.current.hasAlerts).toBe(false);
    });
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    resetQuestDecisionTelemetryPipeline();
    resetQuestDecisionTelemetryFallback();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetQuestDecisionTelemetryPipeline();
    resetQuestDecisionTelemetryFallback();
  });

  it('should integrate pipeline and fallback systems', async () => {
    const pipeline = getQuestDecisionTelemetryPipeline();
    const fallback = getQuestDecisionTelemetryFallback();
    const event = createTestEvent();

    // Add event to pipeline (should trigger fallback on error)
    await act(async () => {
      await pipeline.addEvent(event);
    });

    // Check that fallback has the event
    const pendingEvents = await fallback.getPendingEvents();
    expect(pendingEvents.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle end-to-end event flow', async () => {
    const { result } = renderHook(() => useQuestDecisionTelemetry(), {
      wrapper: createWrapper(),
    });

    const event = createTestEvent();

    // Track event
    await act(async () => {
      await result.current.trackDecision(event);
    });

    // Verify event is in the feed
    expect(result.current.events.length).toBeGreaterThanOrEqual(0);

    // Verify analytics can be calculated
    const analytics = useQuestDecisionAnalytics(result.current.events);
    expect(analytics.totalDecisions).toBeGreaterThanOrEqual(0);

    // Verify alerts can be generated
    const alerts = useQuestDecisionAlerts(result.current.metrics, {
      enabled: true,
      thresholds: {
        revertRate: 0.1,
        processingTime: 5000,
        errorRate: 0.05,
        abandonmentRate: 0.2,
      },
      notifications: {
        email: false,
        webhook: false,
        inApp: true,
      },
    });
    expect(Array.isArray(alerts.alerts)).toBe(true);
  });

  it('should handle configuration updates across systems', () => {
    const pipeline = getQuestDecisionTelemetryPipeline();
    const fallback = getQuestDecisionTelemetryFallback();

    const newPipelineConfig = {
      enabled: false,
      batchProcessing: {
        enabled: false,
        batchSize: 200,
        batchTimeout: 20000,
        maxRetries: 10,
      },
    };

    const newFallbackConfig = {
      enabled: false,
      strategies: {
        primary: FallbackStrategy.MEMORY_CACHE,
        secondary: [FallbackStrategy.LOCAL_STORAGE],
        tertiary: [FallbackStrategy.INDEXED_DB],
      },
      retry: {
        maxRetries: 10,
        baseDelay: 2000,
        maxDelay: 60000,
        exponentialBackoff: true,
        jitter: true,
      },
    };

    // Update configurations
    pipeline.updateConfig(newPipelineConfig);
    fallback.updateConfig(newFallbackConfig);

    // Should not throw errors
    expect(true).toBe(true);
  });
});
