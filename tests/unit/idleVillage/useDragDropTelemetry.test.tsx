/**
 * Unit Tests for Drag/Drop Telemetry Hook
 * 
 * Tests the comprehensive telemetry tracking system for drag/drop operations
 * including session management, event tracking, validation telemetry, and
 * performance monitoring.
 * 
 * @since IV-PhaseE-drop-telemetry
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { useDragDropTelemetryTracking } from '@/ui/idleVillage/hooks/useDragDropTelemetry';
import { useDragDropTelemetry } from '@/ui/idleVillage/utils/dragDropTelemetry';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DragDropTelemetryPayload } from '@/ui/idleVillage/utils/dragDropTelemetry';

// Mock the sandbox diagnostics
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: vi.fn(() => ({
    track: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn(() => 1000);
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

// Mock Date.now for consistent testing
const mockDateNow = vi.fn(() => 1640995200000);
Object.defineProperty(global, 'Date', {
  value: {
    now: mockDateNow,
  },
  writable: true,
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
  },
  writable: true,
});

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    screen: {
      width: 1920,
      height: 1080,
    },
  },
  writable: true,
});

describe('useDragDropTelemetryTracking', () => {
  const mockResident: ResidentState = {
    id: 'resident-123',
    name: 'Test Resident',
    stats: {
      hp: 100,
      strength: 10,
      agility: 8,
      intelligence: 12,
    },
    fatigue: 0.2,
    isAvailable: true,
    currentActivity: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);
    mockDateNow.mockReturnValue(1640995200000);
  });

  describe('Basic Functionality', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking());

      expect(result.current.currentSessionId).toBeUndefined();
      expect(typeof result.current.startDrag).toBe('function');
      expect(typeof result.current.endDrag).toBe('function');
      expect(typeof result.current.trackDropApplied).toBe('function');
      expect(typeof result.current.trackDropBlocked).toBe('function');
      expect(typeof result.current.startValidation).toBe('function');
      expect(typeof result.current.endValidation).toBe('function');
    });

    it('should respect enabled flag', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ enabled: false }));

      const sessionId = result.current.startDrag({
        resident: mockResident,
        sourceLocation: 'slot-1',
      });

      expect(sessionId).toBe('');
      expect(result.current.currentSessionId).toBeUndefined();
    });

    it('should start a drag session and track events', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ enabled: true }));

      act(() => {
        const sessionId = result.current.startDrag({
          resident: mockResident,
          sourceLocation: 'slot-1',
          mousePosition: { x: 100, y: 200 },
        });

        expect(sessionId).toBeTruthy();
        expect(result.current.currentSessionId).toBe(sessionId);
      });

      const events = result.current.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('drag_start');
      expect(events[0].residentId).toBe(mockResident.id);
      expect(events[0].sourceLocation).toBe('slot-1');
    });

    it('should end a drag session with reason', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ enabled: true }));

      act(() => {
        result.current.startDrag({
          resident: mockResident,
          sourceLocation: 'slot-1',
        });

        result.current.endDrag({
          reason: 'drop_applied',
          targetLocation: 'slot-2',
          activityId: 'activity-123',
        });
      });

      const events = result.current.getEvents();
      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe('drag_start');
      expect(events[1].eventType).toBe('drag_end');
      expect(events[1].metadata?.tags).toContain('end_reason:drop_applied');
      expect(result.current.currentSessionId).toBeUndefined();
    });
  });

  describe('Drop Tracking', () => {
    it('should track drop attempts', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ enabled: true }));

      act(() => {
        result.current.startDrag({ resident: mockResident });
        result.current.trackDropAttempt({
          resident: mockResident,
          targetLocation: 'slot-2',
          activityId: 'activity-123',
          mousePosition: { x: 150, y: 250 },
        });
      });

      const events = result.current.getEvents();
      expect(events).toHaveLength(2);
      expect(events[1].eventType).toBe('drop_start');
      expect(events[1].targetLocation).toBe('slot-2');
      expect(events[1].activityId).toBe('activity-123');
    });

    it('should track successful drop applications', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ enabled: true }));

      act(() => {
        result.current.startDrag({ resident: mockResident });
        result.current.trackDropApplied({
          resident: mockResident,
          targetLocation: 'slot-2',
          activityId: 'activity-123',
          applyTime: 150,
        });
      });

      const events = result.current.getEvents();
      expect(events).toHaveLength(3); // drag_start, drop_apply, drag_end
      expect(events[1].eventType).toBe('drop_apply');
      expect(events[1].performance?.applyTime).toBe(150);
      expect(events[1].metadata?.tags).toContain('success');
    });

    it('should track blocked drops with validation details', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ enabled: true }));

      act(() => {
        result.current.startDrag({ resident: mockResident });
        result.current.trackDropBlocked({
          resident: mockResident,
          targetLocation: 'slot-2',
          activityId: 'activity-123',
          rule: 'fatigue_threshold',
          message: 'Resident is too exhausted',
          details: {
            fatigueLevel: 0.8,
            fatigueThreshold: 0.7,
          },
        });
      });

      const events = result.current.getEvents();
      expect(events).toHaveLength(3); // drag_start, drop_block, drag_end
      expect(events[1].eventType).toBe('drop_block');
      expect(events[1].validationResult?.isValid).toBe(false);
      expect(events[1].validationResult?.rule).toBe('fatigue_threshold');
      expect(events[1].validationResult?.message).toBe('Resident is too exhausted');
      expect(events[1].metadata?.tags).toContain('blocked');
      expect(events[1].metadata?.tags).toContain('rule:fatigue_threshold');
    });
  });

  describe('Validation Telemetry', () => {
    it('should track validation start and end', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ enabled: true }));

      let startTime: number;
      
      act(() => {
        startTime = result.current.startValidation({
          resident: mockResident,
          targetLocation: 'slot-2',
          activityId: 'activity-123',
        });
      });

      expect(startTime).toBe(1000);

      act(() => {
        mockPerformanceNow.mockReturnValue(1050);
        result.current.endValidation({
          resident: mockResident,
          targetLocation: 'slot-2',
          activityId: 'activity-123',
          isValid: true,
          startTime,
        });
      });

      const events = result.current.getEvents();
      const validationEvents = events.filter(e => e.eventType === 'validation_start' || e.eventType === 'validation_end');
      expect(validationEvents).toHaveLength(2);
      expect(validationEvents[1].performance?.validationTime).toBe(50);
    });

    it('should track validation failures', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ enabled: true }));

      let startTime: number;
      
      act(() => {
        startTime = result.current.startValidation({
          resident: mockResident,
          targetLocation: 'slot-2',
        });
      });

      act(() => {
        result.current.endValidation({
          resident: mockResident,
          targetLocation: 'slot-2',
          isValid: false,
          rule: 'stat_requirements',
          message: 'Insufficient strength',
          details: {
            missingStats: ['strength'],
            requiredValue: 15,
            currentValue: 10,
          },
          startTime,
        });
      });

      const events = result.current.getEvents();
      const validationEndEvent = events.find(e => e.eventType === 'validation_end');
      expect(validationEndEvent?.validationResult?.isValid).toBe(false);
      expect(validationEndEvent?.validationResult?.rule).toBe('stat_requirements');
    });
  });

  describe('Interaction Tracking', () => {
    it('should track mouse position updates', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ 
        enabled: true,
        trackInteractions: true,
      }));

      act(() => {
        result.current.startDrag({ resident: mockResident });
        result.current.updateMousePosition({ x: 100, y: 200 });
        result.current.updateMousePosition({ x: 150, y: 250 });
      });

      // Mouse position tracking is internal to the session
      expect(result.current.currentSessionId).toBeTruthy();
    });

    it('should track hover targets', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ 
        enabled: true,
        trackInteractions: true,
      }));

      act(() => {
        result.current.startDrag({ resident: mockResident });
        result.current.addHoverTarget('slot-2');
        result.current.addHoverTarget('slot-3');
        result.current.removeHoverTarget('slot-2');
      });

      // Hover target tracking is internal to the session
      expect(result.current.currentSessionId).toBeTruthy();
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics when enabled', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ 
        enabled: true,
        trackPerformance: true,
      }));

      act(() => {
        result.current.startDrag({ resident: mockResident });
        
        // Simulate some time passing
        mockPerformanceNow.mockReturnValue(1100);
        
        result.current.trackDropApplied({
          resident: mockResident,
          targetLocation: 'slot-2',
          applyTime: 100,
        });
      });

      const events = result.current.getEvents();
      const dropEvent = events.find(e => e.eventType === 'drop_apply');
      expect(dropEvent?.performance?.applyTime).toBe(100);
    });

    it('should not track performance when disabled', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ 
        enabled: true,
        trackPerformance: false,
      }));

      act(() => {
        result.current.startDrag({ resident: mockResident });
        result.current.trackDropApplied({
          resident: mockResident,
          targetLocation: 'slot-2',
        });
      });

      const events = result.current.getEvents();
      const dropEvent = events.find(e => e.eventType === 'drop_apply');
      expect(dropEvent?.performance).toBeUndefined();
    });
  });

  describe('Data Export', () => {
    it('should export telemetry data with metadata', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ 
        enabled: true,
        context: 'map_drag',
      }));

      act(() => {
        result.current.startDrag({ resident: mockResident });
        result.current.trackDropAttempt({
          resident: mockResident,
          targetLocation: 'slot-2',
        });
      });

      const exportData = result.current.exportData();
      
      expect(exportData.metadata).toBeDefined();
      expect(exportData.metadata.context).toBe('map_drag');
      expect(exportData.metadata.eventCount).toBe(2);
      expect(exportData.events).toHaveLength(2);
      expect(exportData.events[0].eventType).toBe('drag_start');
      expect(exportData.events[1].eventType).toBe('drop_start');
    });

    it('should filter events when requested', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ enabled: true }));

      act(() => {
        result.current.startDrag({ resident: mockResident });
        result.current.trackDropAttempt({
          resident: mockResident,
          targetLocation: 'slot-2',
        });
        result.current.trackDropBlocked({
          resident: mockResident,
          targetLocation: 'slot-2',
          rule: 'fatigue_threshold',
          message: 'Too tired',
        });
      });

      const allEvents = result.current.getEvents();
      expect(allEvents).toHaveLength(3);

      const blockEvents = result.current.getEvents({ eventType: 'drop_block' });
      expect(blockEvents).toHaveLength(1);
      expect(blockEvents[0].eventType).toBe('drop_block');

      const residentEvents = result.current.getEvents({ residentId: mockResident.id });
      expect(residentEvents).toHaveLength(3);
    });
  });

  describe('Context and Metadata', () => {
    it('should include context in events', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ 
        enabled: true,
        context: 'roster_drag',
      }));

      act(() => {
        result.current.startDrag({ resident: mockResident });
      });

      const events = result.current.getEvents();
      expect(events[0].context).toBe('roster_drag');
    });

    it('should include custom metadata in events', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ 
        enabled: true,
        metadata: { userId: 'user-123', sessionId: 'session-456' },
      }));

      act(() => {
        result.current.startDrag({ resident: mockResident });
      });

      const events = result.current.getEvents();
      expect(events[0].metadata?.userId).toBe('user-123');
      expect(events[0].metadata?.sessionId).toBe('session-456');
    });
  });

  describe('Error Handling', () => {
    it('should handle operations without active session gracefully', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ enabled: true }));

      // These should not throw errors even without a session
      expect(() => {
        result.current.endDrag({ reason: 'drag_abandoned' });
        result.current.trackDropApplied({
          resident: mockResident,
          targetLocation: 'slot-2',
        });
        result.current.trackDropBlocked({
          resident: mockResident,
          targetLocation: 'slot-2',
          rule: 'fatigue_threshold',
          message: 'Too tired',
        });
      }).not.toThrow();

      const events = result.current.getEvents();
      expect(events).toHaveLength(0);
    });

    it('should handle multiple session starts correctly', () => {
      const { result } = renderHook(() => useDragDropTelemetryTracking({ enabled: true }));

      act(() => {
        const sessionId1 = result.current.startDrag({ resident: mockResident });
        expect(sessionId1).toBeTruthy();
        
        // Starting a new session should end the previous one
        const sessionId2 = result.current.startDrag({ resident: mockResident });
        expect(sessionId2).toBeTruthy();
        expect(sessionId2).not.toBe(sessionId1);
      });

      const events = result.current.getEvents();
      // Should have drag_start, drag_end (auto-ended), drag_start
      expect(events.length).toBeGreaterThanOrEqual(2);
      expect(events.filter(e => e.eventType === 'drag_start').length).toBe(2);
      expect(events.filter(e => e.eventType === 'drag_end').length).toBe(1);
    });
  });
});

describe('useDragDropTelemetry (base hook)', () => {
  it('should initialize with default config', () => {
    const { result } = renderHook(() => useDragDropTelemetry());

    expect(result.current.config.enabled).toBe(true);
    expect(result.current.config.trackPerformance).toBe(true);
    expect(typeof result.current.startSession).toBe('function');
    expect(typeof result.current.trackEvent).toBe('function');
    expect(typeof result.current.getEvents).toBe('function');
  });

  it('should respect configuration overrides', () => {
    const { result } = renderHook(() => useDragDropTelemetry({
      enabled: false,
      trackPerformance: false,
      logToConsole: true,
    }));

    expect(result.current.config.enabled).toBe(false);
    expect(result.current.config.trackPerformance).toBe(false);
    expect(result.current.config.logToConsole).toBe(true);
  });

  it('should manage session lifecycle', () => {
    const { result } = renderHook(() => useDragDropTelemetry({ enabled: true }));

    act(() => {
      const sessionId = result.current.startSession({
        residentId: 'resident-123',
        sourceLocation: 'slot-1',
        mousePosition: { x: 100, y: 200 },
      });

      expect(sessionId).toBeTruthy();
      expect(result.current.currentSession?.id).toBe(sessionId);

      result.current.endSession('test_end');
    });

    expect(result.current.currentSession).toBeNull();
  });

  it('should track events with proper payload structure', () => {
    const { result } = renderHook(() => useDragDropTelemetry({ enabled: true }));

    act(() => {
      result.current.startSession({ residentId: 'resident-123' });
      
      result.current.trackEvent({
        eventType: 'drag_start',
        sessionId: result.current.currentSession?.id || '',
        residentId: 'resident-123',
        context: 'map_drag',
        timestamp: Date.now(),
      });
    });

    const events = result.current.getEvents();
    expect(events).toHaveLength(2); // session start + tracked event
    expect(events[1].eventType).toBe('drag_start');
    expect(events[1].residentId).toBe('resident-123');
    expect(events[1].context).toBe('map_drag');
    expect(events[1].metadata?.sequenceNumber).toBeDefined();
    expect(events[1].metadata?.userAgent).toBeDefined();
    expect(events[1].metadata?.screenResolution).toBe('1920x1080');
  });
});
