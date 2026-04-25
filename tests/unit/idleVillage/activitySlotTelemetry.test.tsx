/**
 * Test Suite for Activity Slot Telemetry System
 * 
 * Comprehensive test coverage for the telemetry mapper, hooks, and aggregation utilities.
 * Tests include unit tests, integration tests, and performance tests.
 * 
 * @since NP-016
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import { ActivitySlotTelemetryMapper, getActivitySlotTelemetryMapper } from '@/ui/idleVillage/telemetry/activitySlotTelemetryMapper';
import { useActivitySlotTelemetry, useDragTelemetry, useValidationTelemetry } from '@/ui/idleVillage/telemetry/hooks/useActivitySlotTelemetry';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// Mock data for testing
const mockResident: ResidentState = {
  id: 'resident-1',
  displayName: 'Test Resident',
  status: 'available',
  fatigue: 10,
  statProfileId: 'test-profile',
};

const mockActivity: ActivityDefinition = {
  id: 'activity-1',
  name: 'Test Activity',
  difficulty: 1,
  duration: 100,
  maxSlots: 2,
  tags: ['test'],
  customErrorMessages: {},
};

const mockValidationResult: DropValidationResult = {
  isValid: true,
};

const mockValidationFailure: DropValidationResult = {
  isValid: false,
  failedRule: 'fatigue_threshold',
  message: 'Resident too exhausted',
};

describe('ActivitySlotTelemetryMapper', () => {
  let mapper: ActivitySlotTelemetryMapper;

  beforeEach(() => {
    mapper = new ActivitySlotTelemetryMapper({
      enabled: true,
      samplingRate: 1.0,
      maxEventsInMemory: 100,
      persistToStorage: false,
    });
  });

  afterEach(() => {
    mapper.clearEvents();
  });

  describe('Basic Event Recording', () => {
    it('should record drag start events', () => {
      mapper.recordDragStart(
        'slot-1',
        mockActivity,
        mockResident,
        { type: 'activity_slot', slotId: 'slot-2' },
        { x: 100, y: 200 }
      );

      const events = mapper.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('drag_start');
      expect(events[0].slotId).toBe('slot-1');
      expect(events[0].activity).toBe(mockActivity);
    });

    it('should record drag complete events', () => {
      mapper.recordDragComplete(
        'slot-1',
        mockActivity,
        mockResident,
        { slotId: 'slot-1', previousOccupants: 0, newOccupants: 1, wasEmpty: true },
        mockValidationResult
      );

      const events = mapper.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('drag_complete');
      expect((events[0].payload as any).successMetrics.wasSuccessful).toBe(true);
    });

    it('should record drag cancel events', () => {
      mapper.recordDragCancel(
        'slot-1',
        mockActivity,
        mockResident,
        'user_abort',
        { x: 150, y: 250 },
        500
      );

      const events = mapper.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('drag_cancel');
      expect((events[0].payload as any).cancelReason).toBe('user_abort');
    });

    it('should record resident assign events', () => {
      mapper.recordResidentAssign(
        'slot-1',
        mockActivity,
        mockResident,
        'drag_drop',
        { occupants: 0, residentIds: [], wasLocked: false },
        { occupants: 1, residentIds: ['resident-1'], isLocked: false },
        { processingTime: 50, validationTime: 20, uiUpdateTime: 10 }
      );

      const events = mapper.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('resident_assign');
      expect((events[0].payload as any).assignmentMethod).toBe('drag_drop');
    });

    it('should record assign failure events', () => {
      mapper.recordAssignFailure(
        'slot-1',
        mockActivity,
        mockResident,
        'Too exhausted',
        'fatigue_threshold',
        { slotId: 'slot-1', currentOccupants: 1, maxOccupants: 2, isLocked: false },
        { validationTime: 25, errorMessage: 'Too exhausted', isRetryable: true }
      );

      const events = mapper.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('assign_failure');
      expect((events[0].payload as any).failureReason).toBe('Too exhausted');
    });

    it('should record validation check events', () => {
      mapper.recordValidationCheck(
        'slot-1',
        mockActivity,
        mockResident,
        { checkType: 'pre_assign', validationRules: ['availability', 'fatigue'], strictMode: false },
        mockValidationResult,
        { validationTime: 15, rulesChecked: 2, rulesPassed: 2, rulesFailed: 0 }
      );

      const events = mapper.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('validation_check');
      expect((events[0].payload as any).validationResult.isValid).toBe(true);
    });

    it('should record performance metric events', () => {
      mapper.recordPerformanceMetric(
        'slot-1',
        mockActivity,
        'validation_time',
        25,
        'ms',
        { operation: 'validation', component: 'activity_slot', userInteraction: true, systemLoad: 'low' }
      );

      const events = mapper.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('performance_metric');
      expect((events[0].payload as any).metricType).toBe('validation_time');
      expect((events[0].payload as any).value).toBe(25);
    });
  });

  describe('Event Filtering and Querying', () => {
    beforeEach(() => {
      // Add various events for testing
      mapper.recordDragStart('slot-1', mockActivity, mockResident, { type: 'resident_list' }, { x: 0, y: 0 });
      mapper.recordDragComplete('slot-1', mockActivity, mockResident, { slotId: 'slot-1', previousOccupants: 0, newOccupants: 1, wasEmpty: true }, mockValidationResult);
      mapper.recordAssignFailure('slot-2', mockActivity, mockResident, 'Too exhausted', 'fatigue_threshold', { slotId: 'slot-2', currentOccupants: 1, maxOccupants: 2, isLocked: false }, { validationTime: 25, errorMessage: 'Too exhausted', isRetryable: true });
      mapper.recordPerformanceMetric('slot-1', mockActivity, 'validation_time', 25, 'ms', { operation: 'validation', component: 'activity_slot', userInteraction: true, systemLoad: 'low' });
    });

    it('should filter events by type', () => {
      const dragEvents = mapper.getEventsByType('drag_start');
      expect(dragEvents).toHaveLength(1);
      expect(dragEvents[0].type).toBe('drag_start');

      const failureEvents = mapper.getEventsByType('assign_failure');
      expect(failureEvents).toHaveLength(1);
      expect(failureEvents[0].type).toBe('assign_failure');
    });

    it('should filter events by slot ID', () => {
      const slot1Events = mapper.getEventsBySlot('slot-1');
      expect(slot1Events).toHaveLength(3); // drag_start, drag_complete, performance_metric

      const slot2Events = mapper.getEventsBySlot('slot-2');
      expect(slot2Events).toHaveLength(1); // assign_failure
    });

    it('should filter events by time range', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      const recentEvents = mapper.getEventsByTimeRange(oneHourAgo, now);
      expect(recentEvents.length).toBeGreaterThan(0);

      const futureEvents = mapper.getEventsByTimeRange(now + 1000, now + 2000);
      expect(futureEvents).toHaveLength(0);
    });
  });

  describe('Configuration and Sampling', () => {
    it('should respect sampling rate', () => {
      const sampledMapper = new ActivitySlotTelemetryMapper({
        enabled: true,
        samplingRate: 0.0, // No sampling
      });

      sampledMapper.recordDragStart('slot-1', mockActivity, mockResident, { type: 'resident_list' }, { x: 0, y: 0 });
      
      const events = sampledMapper.getEvents();
      expect(events).toHaveLength(0); // Should be filtered out by sampling
    });

    it('should respect enabled flag', () => {
      const disabledMapper = new ActivitySlotTelemetryMapper({
        enabled: false,
        samplingRate: 1.0,
      });

      disabledMapper.recordDragStart('slot-1', mockActivity, mockResident, { type: 'resident_list' }, { x: 0, y: 0 });
      
      const events = disabledMapper.getEvents();
      expect(events).toHaveLength(0); // Should be filtered out by disabled flag
    });

    it('should update configuration', () => {
      mapper.updateConfig({ samplingRate: 0.5 });
      
      const config = mapper.getConfig();
      expect(config.samplingRate).toBe(0.5);
    });
  });

  describe('Data Export and Summary', () => {
    beforeEach(() => {
      // Add test events
      mapper.recordDragStart('slot-1', mockActivity, mockResident, { type: 'resident_list' }, { x: 0, y: 0 });
      mapper.recordDragComplete('slot-1', mockActivity, mockResident, { slotId: 'slot-1', previousOccupants: 0, newOccupants: 1, wasEmpty: true }, mockValidationResult);
      mapper.recordPerformanceMetric('slot-1', mockActivity, 'validation_time', 25, 'ms', { operation: 'validation', component: 'activity_slot', userInteraction: true, systemLoad: 'low' });
    });

    it('should generate event summary', () => {
      const summary = mapper.generateEventSummary();
      
      expect(summary.totalEvents).toBe(3);
      expect(summary.eventsByType['drag_start']).toBe(1);
      expect(summary.eventsByType['drag_complete']).toBe(1);
      expect(summary.eventsByType['performance_metric']).toBe(1);
      expect(summary.eventsBySlot['slot-1']).toBe(3);
    });

    it('should export events as JSON', () => {
      const exported = mapper.exportEvents();
      const data = JSON.parse(exported);
      
      expect(data.events).toHaveLength(3);
      expect(data.sessionId).toBeDefined();
      expect(data.config).toBeDefined();
      expect(data.summary).toBeDefined();
    });

    it('should clear events', () => {
      mapper.clearEvents();
      
      const events = mapper.getEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('Session Management', () => {
    it('should generate unique session ID', () => {
      const sessionId = mapper.getSessionId();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
    });

    it('should maintain session ID across events', () => {
      mapper.recordDragStart('slot-1', mockActivity, mockResident, { type: 'resident_list' }, { x: 0, y: 0 });
      mapper.recordDragComplete('slot-1', mockActivity, mockResident, { slotId: 'slot-1', previousOccupants: 0, newOccupants: 1, wasEmpty: true }, mockValidationResult);
      
      const events = mapper.getEvents();
      expect(events[0].sessionId).toBe(events[1].sessionId);
    });
  });
});

describe('useActivitySlotTelemetry Hook', () => {
  beforeEach(() => {
    // Clear global mapper
    vi.clearAllMocks();
  });

  it('should provide telemetry recording functions', () => {
    const { result } = renderHook(() => useActivitySlotTelemetry());
    
    expect(result.current.recordDragStart).toBeDefined();
    expect(result.current.recordDragComplete).toBeDefined();
    expect(result.current.recordDragCancel).toBeDefined();
    expect(result.current.recordResidentAssign).toBeDefined();
    expect(result.current.recordAssignFailure).toBeDefined();
    expect(result.current.recordValidationCheck).toBeDefined();
    expect(result.current.recordPerformanceMetric).toBeDefined();
  });

  it('should record events through hook', () => {
    const { result } = renderHook(() => useActivitySlotTelemetry());
    
    act(() => {
      result.current.recordDragStart(
        'slot-1',
        mockActivity,
        mockResident,
        { type: 'resident_list' },
        { x: 0, y: 0 }
      );
    });
    
    const events = result.current.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('drag_start');
  });

  it('should respect configuration', () => {
    const { result } = renderHook(() => useActivitySlotTelemetry({
      config: { samplingRate: 0.0 }, // No sampling
    }));
    
    act(() => {
      result.current.recordDragStart(
        'slot-1',
        mockActivity,
        mockResident,
        { type: 'resident_list' },
        { x: 0, y: 0 }
      );
    });
    
    const events = result.current.getEvents();
    expect(events).toHaveLength(0); // Should be filtered out
  });

  it('should provide utility functions', () => {
    const { result } = renderHook(() => useActivitySlotTelemetry());
    
    expect(result.current.getEvents).toBeDefined();
    expect(result.current.getEventsByType).toBeDefined();
    expect(result.current.getEventsBySlot).toBeDefined();
    expect(result.current.clearEvents).toBeDefined();
    expect(result.current.exportEvents).toBeDefined();
    expect(result.current.generateEventSummary).toBeDefined();
  });
});

describe('useDragTelemetry Hook', () => {
  it('should provide drag-specific handlers', () => {
    const { result } = renderHook(() => useDragTelemetry({
      slotId: 'slot-1',
      activity: mockActivity,
    }));
    
    expect(result.current.handleDragStart).toBeDefined();
    expect(result.current.handleDragComplete).toBeDefined();
    expect(result.current.handleDragCancel).toBeDefined();
  });

  it('should call callbacks on drag events', () => {
    const onDragStart = vi.fn();
    const onDragComplete = vi.fn();
    const onDragCancel = vi.fn();
    
    const { result } = renderHook(() => useDragTelemetry({
      slotId: 'slot-1',
      activity: mockActivity,
      onDragStart,
      onDragComplete,
      onDragCancel,
    }));
    
    act(() => {
      result.current.handleDragStart(mockResident, { type: 'resident_list' }, { x: 0, y: 0 });
    });
    
    expect(onDragStart).toHaveBeenCalledWith(mockResident, { type: 'resident_list' });
    
    act(() => {
      result.current.handleDragComplete(
        mockResident,
        { slotId: 'slot-1', previousOccupants: 0, newOccupants: 1, wasEmpty: true },
        mockValidationResult
      );
    });
    
    expect(onDragComplete).toHaveBeenCalledWith(
      mockResident,
      { slotId: 'slot-1', previousOccupants: 0, newOccupants: 1, wasEmpty: true },
      mockValidationResult
    );
  });
});

describe('useValidationTelemetry Hook', () => {
  it('should provide validation recording function', () => {
    const { result } = renderHook(() => useValidationTelemetry({
      slotId: 'slot-1',
      activity: mockActivity,
    }));
    
    expect(result.current.recordValidation).toBeDefined();
  });

  it('should record validation events', () => {
    const { result } = renderHook(() => useValidationTelemetry({
      slotId: 'slot-1',
      activity: mockActivity,
    }));
    
    act(() => {
      result.current.recordValidation(mockResident, mockValidationResult);
    });
    
    const events = result.current.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('validation_check');
  });
});

describe('Telemetry Aggregation', () => {
  let mapper: ActivitySlotTelemetryMapper;

  beforeEach(() => {
    mapper = new ActivitySlotTelemetryMapper({
      enabled: true,
      samplingRate: 1.0,
      maxEventsInMemory: 100,
      persistToStorage: false,
    });

    // Add test events for aggregation
    for (let i = 0; i < 20; i++) {
      mapper.recordDragStart(`slot-${i % 3}`, mockActivity, mockResident, { type: 'resident_list' }, { x: i, y: i });
      mapper.recordDragComplete(`slot-${i % 3}`, mockActivity, mockResident, { slotId: `slot-${i % 3}`, previousOccupants: 0, newOccupants: 1, wasEmpty: true }, mockValidationResult);
      mapper.recordPerformanceMetric(`slot-${i % 3}`, mockActivity, 'validation_time', 10 + i, 'ms', { operation: 'validation', component: 'activity_slot', userInteraction: true, systemLoad: 'low' });
      
      if (i % 5 === 0) {
        mapper.recordAssignFailure(`slot-${i % 3}`, mockActivity, mockResident, 'Too exhausted', 'fatigue_threshold', { slotId: `slot-${i % 3}`, currentOccupants: 1, maxOccupants: 2, isLocked: false }, { validationTime: 25, errorMessage: 'Too exhausted', isRetryable: true });
      }
    }
  });

  it('should aggregate telemetry events', () => {
    const events = mapper.getEvents();
    const aggregation = aggregateTelemetryEvents(events);
    
    expect(aggregation.totalEvents).toBeGreaterThan(0);
    expect(aggregation.eventsByType['drag_start']).toBe(20);
    expect(aggregation.eventsByType['drag_complete']).toBe(20);
    expect(aggregation.eventsByType['performance_metric']).toBe(20);
    expect(aggregation.eventsByType['assign_failure']).toBe(4);
  });

  it('should calculate performance metrics', () => {
    const events = mapper.getEvents();
    const aggregation = aggregateTelemetryEvents(events);
    
    expect(aggregation.performanceMetrics.validationTime.average).toBeGreaterThan(0);
    expect(aggregation.performanceMetrics.validationTime.min).toBeGreaterThan(0);
    expect(aggregation.performanceMetrics.validationTime.max).toBeGreaterThan(0);
    expect(aggregation.performanceMetrics.dragOperations.totalOperations).toBe(20);
  });

  it('should analyze errors', () => {
    const events = mapper.getEvents();
    const aggregation = aggregateTelemetryEvents(events);
    
    expect(aggregation.errorAnalysis.totalErrors).toBe(4);
    expect(aggregation.errorAnalysis.errorRate).toBeGreaterThan(0);
    expect(aggregation.errorAnalysis.errorsByType['assign_failure']).toBe(4);
  });

  it('should analyze usage patterns', () => {
    const events = mapper.getEvents();
    const aggregation = aggregateTelemetryEvents(events);
    
    expect(aggregation.usagePatterns.topSlots.length).toBeGreaterThan(0);
    expect(aggregation.usagePatterns.interactionPatterns.dragDropUsage).toBeGreaterThan(0);
  });
});

describe('Telemetry Insights', () => {
  let mapper: ActivitySlotTelemetryMapper;

  beforeEach(() => {
    mapper = new ActivitySlotTelemetryMapper({
      enabled: true,
      samplingRate: 1.0,
      maxEventsInMemory: 100,
      persistToStorage: false,
    });

    // Add events with performance issues
    for (let i = 0; i < 10; i++) {
      mapper.recordPerformanceMetric('slot-1', mockActivity, 'validation_time', 150 + i, 'ms', { operation: 'validation', component: 'activity_slot', userInteraction: true, systemLoad: 'low' });
    }
    
    // Add some failures
    for (let i = 0; i < 5; i++) {
      mapper.recordAssignFailure('slot-1', mockActivity, mockResident, 'Too exhausted', 'fatigue_threshold', { slotId: 'slot-1', currentOccupants: 1, maxOccupants: 2, isLocked: false }, { validationTime: 25, errorMessage: 'Too exhausted', isRetryable: true });
    }
  });

  it('should generate insights from aggregation', () => {
    const events = mapper.getEvents();
    const aggregation = aggregateTelemetryEvents(events);
    const insights = generateTelemetryInsights(aggregation);
    
    expect(insights.performanceInsights.length).toBeGreaterThan(0);
    expect(insights.errorInsights.length).toBeGreaterThan(0);
    expect(insights.recommendations.length).toBeGreaterThan(0);
    expect(insights.overallHealth).toBeDefined();
  });

  it('should identify performance issues', () => {
    const events = mapper.getEvents();
    const aggregation = aggregateTelemetryEvents(events);
    const insights = generateTelemetryInsights(aggregation);
    
    const performanceWarnings = insights.performanceInsights.filter(i => i.type === 'warning');
    expect(performanceWarnings.length).toBeGreaterThan(0);
  });

  it('should identify high error rates', () => {
    const events = mapper.getEvents();
    const aggregation = aggregateTelemetryEvents(events);
    const insights = generateTelemetryInsights(aggregation);
    
    const errorWarnings = insights.errorInsights.filter(i => i.type === 'error');
    expect(errorWarnings.length).toBeGreaterThan(0);
  });
});

describe('Global Mapper Instance', () => {
  it('should return same instance for global mapper', () => {
    const mapper1 = getActivitySlotTelemetryMapper();
    const mapper2 = getActivitySlotTelemetryMapper();
    
    expect(mapper1).toBe(mapper2);
  });

  it('should create new instance when useGlobalMapper is false', () => {
    const { result: result1 } = renderHook(() => useActivitySlotTelemetry({ useGlobalMapper: false }));
    const { result: result2 } = renderHook(() => useActivitySlotTelemetry({ useGlobalMapper: false }));
    
    expect(result1.current.mapper).not.toBe(result2.current.mapper);
  });
});

describe('Performance Tests', () => {
  it('should handle large numbers of events efficiently', () => {
    const mapper = new ActivitySlotTelemetryMapper({
      enabled: true,
      samplingRate: 1.0,
      maxEventsInMemory: 10000,
      persistToStorage: false,
    });

    const startTime = performance.now();
    
    // Add 1000 events
    for (let i = 0; i < 1000; i++) {
      mapper.recordDragStart(`slot-${i}`, mockActivity, mockResident, { type: 'resident_list' }, { x: i, y: i });
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (less than 100ms)
    expect(duration).toBeLessThan(100);
    
    const events = mapper.getEvents();
    expect(events).toHaveLength(1000);
  });

  it('should handle aggregation of large datasets efficiently', () => {
    const mapper = new ActivitySlotTelemetryMapper({
      enabled: true,
      samplingRate: 1.0,
      maxEventsInMemory: 5000,
      persistToStorage: false,
    });

    // Add 5000 mixed events
    for (let i = 0; i < 5000; i++) {
      if (i % 3 === 0) {
        mapper.recordDragStart(`slot-${i % 10}`, mockActivity, mockResident, { type: 'resident_list' }, { x: i, y: i });
      } else if (i % 3 === 1) {
        mapper.recordDragComplete(`slot-${i % 10}`, mockActivity, mockResident, { slotId: `slot-${i % 10}`, previousOccupants: 0, newOccupants: 1, wasEmpty: true }, mockValidationResult);
      } else {
        mapper.recordPerformanceMetric(`slot-${i % 10}`, mockActivity, 'validation_time', 10 + i, 'ms', { operation: 'validation', component: 'activity_slot', userInteraction: true, systemLoad: 'low' });
      }
    }

    const startTime = performance.now();
    const events = mapper.getEvents();
    const aggregation = aggregateTelemetryEvents(events);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (less than 500ms)
    expect(duration).toBeLessThan(500);
    expect(aggregation.totalEvents).toBe(5000);
  });
});

describe('Error Handling', () => {
  it('should handle invalid event data gracefully', () => {
    const mapper = new ActivitySlotTelemetryMapper();
    
    // This should not throw an error
    expect(() => {
      mapper.recordDragStart('', {} as ActivityDefinition, {} as ResidentState, { type: 'invalid' }, { x: 0, y: 0 });
    }).not.toThrow();
  });

  it('should handle configuration errors gracefully', () => {
    // This should not throw an error
    expect(() => {
      new ActivitySlotTelemetryMapper({
        enabled: true,
        samplingRate: -1, // Invalid sampling rate
        maxEventsInMemory: -1, // Invalid max events
      });
    }).not.toThrow();
  });

  it('should handle aggregation with insufficient events', () => {
    const mapper = new ActivitySlotTelemetryMapper();
    
    // Add only a few events
    mapper.recordDragStart('slot-1', mockActivity, mockResident, { type: 'resident_list' }, { x: 0, y: 0 });
    
    const events = mapper.getEvents();
    
    // Should throw error for insufficient events
    expect(() => {
      aggregateTelemetryEvents(events, { minEvents: 10 });
    }).toThrow('Insufficient events for analysis');
  });
});
