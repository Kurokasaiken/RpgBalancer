/**
 * NP-102 ActivitySlot Telemetry Mirror Tests
 * 
 * Comprehensive test suite for ActivitySlot telemetry mirror functionality.
 * Tests schema validation, hook behavior, export functionality, and edge cases.
 * 
 * @author Helix-Idle – Activity Telemetry
 * @since 2026-01-21
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useActivitySlotTelemetry, useActivitySlotTelemetrySubscriber } from '@/ui/idleVillage/hooks/useActivitySlotTelemetry';
import {
  ACTIVITYSLOT_TELEMETRY_EVENTS,
  SLOT_STATES,
  DROP_RESULTS,
  ActivitySlotTelemetryUtils,
  DEFAULT_ACTIVITYSLOT_TELEMETRY_CONFIG,
  type ActivitySlotTelemetryEvent,
  type ActivitySlotTelemetryData,
  type ResidentState,
} from '@/ui/idleVillage/activeHud/ActivitySlotTelemetryMirror';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';

// Mock persistence service
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
  clearData: vi.fn(),
}));

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
  writable: true,
});

// Test fixtures
const mockResident: ResidentState = {
  id: 'resident-1',
  displayName: 'Test Resident',
  fatigue: 25,
  isInjured: false,
  status: 'available',
  stats: {
    strength: 10,
    agility: 8,
    intelligence: 6,
  },
  currentActivity: undefined,
};

const mockSlotData: ActivitySlotData = {
  slotId: 'forest-work',
  label: 'Forest Work',
  iconName: 'forest',
  assignedWorkerId: null,
  activity: {
    id: 'forest-work',
    name: 'Forest Work',
    type: 'resource',
    durationFormula: 10,
    statRequirement: { strength: 5 },
  },
  visualVariant: 'default',
};

const mockProgress = {
  fraction: 0.6,
  elapsedSeconds: 36,
  totalSeconds: 60,
};

describe('ActivitySlotTelemetryMirror', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ActivitySlotTelemetryUtils', () => {
    describe('createResidentTelemetryInfo', () => {
      it('should create resident telemetry info from resident state', () => {
        const result = ActivitySlotTelemetryUtils.createResidentTelemetryInfo(mockResident);

        expect(result).toEqual({
          id: 'resident-1',
          displayName: 'Test Resident',
          fatigue: 25,
          isInjured: false,
          status: 'available',
          stats: { strength: 10, agility: 8, intelligence: 6 },
          currentActivity: undefined,
        });
      });

      it('should handle missing display name', () => {
        const residentWithoutName = { ...mockResident, displayName: undefined };
        const result = ActivitySlotTelemetryUtils.createResidentTelemetryInfo(residentWithoutName);

        expect(result.displayName).toBe('resident-1');
      });
    });

    describe('createSlotTelemetryData', () => {
      it('should create slot telemetry data with all parameters', () => {
        const result = ActivitySlotTelemetryUtils.createSlotTelemetryData(
          mockSlotData,
          SLOT_STATES.OCCUPIED,
          mockResident,
          mockProgress,
          DROP_RESULTS.VALID,
        );

        expect(result).toMatchObject({
          slotId: 'forest-work',
          slotLabel: 'Forest Work',
          state: 'occupied',
          activity: mockSlotData.activity,
          resident: expect.objectContaining({
            id: 'resident-1',
            displayName: 'Test Resident',
          }),
          progress: expect.objectContaining({
            fraction: 0.6,
            elapsedSeconds: 36,
            totalSeconds: 60,
          }),
          dropResult: 'valid',
          lastStateChanged: expect.any(Number),
          timeInCurrentState: 0,
        });
      });

      it('should create minimal slot telemetry data', () => {
        const result = ActivitySlotTelemetryUtils.createSlotTelemetryData(
          mockSlotData,
          SLOT_STATES.EMPTY,
        );

        expect(result).toMatchObject({
          slotId: 'forest-work',
          slotLabel: 'Forest Work',
          state: 'empty',
          resident: undefined,
          progress: undefined,
          dropResult: undefined,
        });
      });
    });

    describe('generateSessionId', () => {
      it('should generate unique session IDs', () => {
        const id1 = ActivitySlotTelemetryUtils.generateSessionId();
        const id2 = ActivitySlotTelemetryUtils.generateSessionId();

        expect(id1).toMatch(/^activityslot_session_\d+_[a-z0-9]+$/);
        expect(id2).toMatch(/^activityslot_session_\d+_[a-z0-9]+$/);
        expect(id1).not.toBe(id2);
      });
    });

    describe('calculateDropSuccessRate', () => {
      it('should calculate success rate correctly', () => {
        const events: ActivitySlotTelemetryEvent[] = [
          {
            eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_VALIDATED,
            timestamp: Date.now(),
            sessionId: 'test',
            data: {} as ActivitySlotTelemetryData,
          },
          {
            eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_FAILED,
            timestamp: Date.now(),
            sessionId: 'test',
            data: {} as ActivitySlotTelemetryData,
          },
          {
            eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_VALIDATED,
            timestamp: Date.now(),
            sessionId: 'test',
            data: {} as ActivitySlotTelemetryData,
          },
        ];

        const rate = ActivitySlotTelemetryUtils.calculateDropSuccessRate(events);
        expect(rate).toBe(0.67); // 2/3
      });

      it('should return 0 for no drop events', () => {
        const events: ActivitySlotTelemetryEvent[] = [
          {
            eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.SLOT_STATE_CHANGED,
            timestamp: Date.now(),
            sessionId: 'test',
            data: {} as ActivitySlotTelemetryData,
          },
        ];

        const rate = ActivitySlotTelemetryUtils.calculateDropSuccessRate(events);
        expect(rate).toBe(0);
      });
    });

    describe('aggregateSlotStates', () => {
      it('should aggregate slot states correctly', () => {
        const events: ActivitySlotTelemetryEvent[] = [
          {
            eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.SLOT_STATE_CHANGED,
            timestamp: Date.now(),
            sessionId: 'test',
            data: { state: 'empty' } as ActivitySlotTelemetryData,
          },
          {
            eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.SLOT_STATE_CHANGED,
            timestamp: Date.now(),
            sessionId: 'test',
            data: { state: 'occupied' } as ActivitySlotTelemetryData,
          },
          {
            eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.SLOT_STATE_CHANGED,
            timestamp: Date.now(),
            sessionId: 'test',
            data: { state: 'empty' } as ActivitySlotTelemetryData,
          },
        ];

        const states = ActivitySlotTelemetryUtils.aggregateSlotStates(events);
        expect(states).toEqual({
          empty: 2,
          occupied: 1,
        });
      });
    });
  });

  describe('useActivitySlotTelemetry', () => {
    const { saveData, loadData, clearData } = vi.mocked('@/shared/persistence/PersistenceService');

    beforeEach(() => {
      loadData.mockResolvedValue([]);
      saveData.mockResolvedValue();
      clearData.mockResolvedValue();
    });

    it('should initialize with default configuration', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.config).toEqual(DEFAULT_ACTIVITYSLOT_TELEMETRY_CONFIG);
      expect(result.current.events).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should load existing telemetry data on mount', async () => {
      const mockEvents: ActivitySlotTelemetryEvent[] = [
        {
          eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.SLOT_STATE_CHANGED,
          timestamp: Date.now(),
          sessionId: 'test-session',
          data: {
            slotId: 'test-slot',
            slotLabel: 'Test Slot',
            state: 'empty',
            lastStateChanged: Date.now(),
            timeInCurrentState: 0,
          },
        },
      ];

      loadData.mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.events).toEqual(mockEvents);
      expect(loadData).toHaveBeenCalledWith('activityslot-telemetry', []);
    });

    it('should emit custom events', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const customData: ActivitySlotTelemetryData = {
        slotId: 'custom-slot',
        slotLabel: 'Custom Slot',
        state: 'empty',
        lastStateChanged: Date.now(),
        timeInCurrentState: 0,
      };

      act(() => {
        result.current.emitEvent('custom_event', customData, { source: 'test' });
      });

      expect(result.current.events).toHaveLength(2); // MIRROR_ACTIVE + custom event
      expect(result.current.events[1]).toMatchObject({
        eventType: 'custom_event',
        data: customData,
        metadata: expect.objectContaining({
          source: 'useActivitySlotTelemetry',
          source: 'test',
        }),
      });
    });

    it('should track slot state changes', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.trackSlotStateChange(mockSlotData, SLOT_STATES.OCCUPIED, mockResident);
      });

      expect(result.current.events).toHaveLength(2); // MIRROR_ACTIVE + state change
      expect(result.current.events[1]).toMatchObject({
        eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.SLOT_STATE_CHANGED,
        data: expect.objectContaining({
          slotId: 'forest-work',
          state: 'occupied',
          resident: expect.objectContaining({
            id: 'resident-1',
          }),
        }),
      });
    });

    it('should track resident assignments', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.trackResidentAssignment(mockSlotData, mockResident);
      });

      expect(result.current.events).toHaveLength(3); // MIRROR_ACTIVE + state change + assignment
      expect(result.current.events[2]).toMatchObject({
        eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.RESIDENT_ASSIGNED,
        data: expect.objectContaining({
          slotId: 'forest-work',
          state: 'occupied',
          resident: expect.objectContaining({
            id: 'resident-1',
          }),
        }),
      });
    });

    it('should track drop attempts', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.trackDropAttempt(mockSlotData, 'resident-1', DROP_RESULTS.VALID);
      });

      expect(result.current.events).toHaveLength(2); // MIRROR_ACTIVE + drop validated
      expect(result.current.events[1]).toMatchObject({
        eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_VALIDATED,
        data: expect.objectContaining({
          slotId: 'forest-work',
          state: 'occupied',
          dropResult: 'valid',
        }),
      });
    });

    it('should track progress updates', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.trackProgressUpdate(mockSlotData, mockResident, mockProgress);
      });

      expect(result.current.events).toHaveLength(2); // MIRROR_ACTIVE + progress update
      expect(result.current.events[1]).toMatchObject({
        eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.PROGRESS_UPDATED,
        data: expect.objectContaining({
          slotId: 'forest-work',
          state: 'in_progress',
          progress: expect.objectContaining({
            fraction: 0.6,
            elapsedSeconds: 36,
          }),
        }),
      });
    });

    it('should track activity completion', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.trackActivityCompletion(mockSlotData, mockResident);
      });

      expect(result.current.events).toHaveLength(3); // MIRROR_ACTIVE + state change + completion
      expect(result.current.events[2]).toMatchObject({
        eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.ACTIVITY_COMPLETED,
        data: expect.objectContaining({
          slotId: 'forest-work',
          state: 'completed',
          resident: expect.objectContaining({
            id: 'resident-1',
          }),
        }),
      });
    });

    it('should respect sampling rate', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry({ sampleRate: 0.0 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.emitEvent('test_event', {
          slotId: 'test',
          slotLabel: 'Test',
          state: 'empty',
          lastStateChanged: Date.now(),
          timeInCurrentState: 0,
        });
      });

      // Should only have MIRROR_ACTIVE event, test_event should be sampled out
      expect(result.current.events).toHaveLength(1);
    });

    it('should handle disabled telemetry', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry({ enabled: false }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.emitEvent('test_event', {
          slotId: 'test',
          slotLabel: 'Test',
          state: 'empty',
          lastStateChanged: Date.now(),
          timeInCurrentState: 0,
        });
      });

      // Should have no events when disabled
      expect(result.current.events).toHaveLength(0);
    });

    it('should calculate statistics correctly', async () => {
      const mockEvents: ActivitySlotTelemetryEvent[] = [
        {
          eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.SLOT_STATE_CHANGED,
          timestamp: Date.now(),
          sessionId: 'test',
          data: { state: 'empty' } as ActivitySlotTelemetryData,
        },
        {
          eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.RESIDENT_ASSIGNED,
          timestamp: Date.now(),
          sessionId: 'test',
          data: { state: 'occupied' } as ActivitySlotTelemetryData,
        },
        {
          eventType: ACTIVITYSLOT_TELEMETRY_EVENTS.DROP_VALIDATED,
          timestamp: Date.now(),
          sessionId: 'test',
          data: { state: 'occupied' } as ActivitySlotTelemetryData,
        },
      ];

      loadData.mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const stats = result.current.getStatistics();
      expect(stats).toMatchObject({
        totalEvents: 3,
        stateChanges: 1,
        assignments: 1,
        dropAttempts: 1,
        dropSuccessRate: 1.0,
      });
    });

    it('should clear telemetry data', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add some events
      act(() => {
        result.current.emitEvent('test_event', {
          slotId: 'test',
          slotLabel: 'Test',
          state: 'empty',
          lastStateChanged: Date.now(),
          timeInCurrentState: 0,
        });
      });

      expect(result.current.events).toHaveLength(2);

      // Clear events
      await act(async () => {
        await result.current.clearTelemetry();
      });

      expect(result.current.events).toHaveLength(0);
      expect(clearData).toHaveBeenCalledWith('activityslot-telemetry');
    });

    it('should update configuration', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({ sampleRate: 0.5, maxEvents: 500 });
      });

      expect(result.current.config.sampleRate).toBe(0.5);
      expect(result.current.config.maxEvents).toBe(500);
      expect(result.current.config.enabled).toBe(true); // Should preserve other config
    });

    it('should handle export errors', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry({ 
        export: { json: false, csv: false, autoExportInterval: 0 }
      }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.exportTelemetry('json')).rejects.toThrow('JSON export is disabled');
    });
  });

  describe('useActivitySlotTelemetrySubscriber', () => {
    it('should subscribe to telemetry events', () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useActivitySlotTelemetrySubscriber(callback));

      expect(typeof result.current.subscribe).toBe('function');

      const unsubscribe = result.current.subscribe();

      // Emit a custom event
      const customEvent = new CustomEvent('activityslot-telemetry', {
        detail: { eventType: 'test', data: {} },
      });
      window.dispatchEvent(customEvent);

      expect(callback).toHaveBeenCalledWith(customEvent);

      unsubscribe();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid loaded data gracefully', async () => {
      const { loadData } = vi.mocked('@/shared/persistence/PersistenceService');
      loadData.mockResolvedValue([{ invalid: 'data' }]);

      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
      expect(result.current.error).toBe('Failed to load telemetry data');
    });

    it('should handle save errors gracefully', async () => {
      const { saveData } = vi.mocked('@/shared/persistence/PersistenceService');
      saveData.mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() => useActivitySlotTelemetry());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.emitEvent('test_event', {
          slotId: 'test',
          slotLabel: 'Test',
          state: 'empty',
          lastStateChanged: Date.now(),
          timeInCurrentState: 0,
        });
      });

      // Wait for debounced save
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(result.current.error).toBe('Failed to save telemetry data');
    });

    it('should limit events to maxEvents', async () => {
      const { result } = renderHook(() => useActivitySlotTelemetry({ maxEvents: 3 }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Add more events than maxEvents
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.emitEvent(`test_event_${i}`, {
            slotId: `test-${i}`,
            slotLabel: `Test ${i}`,
            state: 'empty',
            lastStateChanged: Date.now(),
            timeInCurrentState: 0,
          });
        });
      }

      expect(result.current.events.length).toBeLessThanOrEqual(3);
    });
  });
});
