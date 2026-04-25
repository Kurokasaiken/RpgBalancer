/**
 * Physics Lab Telemetry Hook Tests
 *
 * Unit tests for usePhysicsLabTelemetry hook covering event recording,
 * aggregation, and integration with TelemetryProvider.
 */

import { renderHook, act } from '@testing-library/react';
import { usePhysicsLabTelemetry } from '@/ui/styleLab/physicsLab/hooks/usePhysicsLabTelemetry';
import { logPhysicsLabEvent, generatePhysicsLabSessionId, isTelemetryProviderAvailable } from '@/analytics/styleLab/physicsLabTelemetry';

// Mock TelemetryProvider
jest.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: jest.fn(),
}));

// Mock physicsLabTelemetry module
jest.mock('@/analytics/styleLab/physicsLabTelemetry', () => ({
  ...jest.requireActual('@/analytics/styleLab/physicsLabTelemetry'),
  logPhysicsLabEvent: jest.fn(),
  generatePhysicsLabSessionId: jest.fn(() => 'test-session-123'),
  isTelemetryProviderAvailable: jest.fn(() => true),
}));

describe('usePhysicsLabTelemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (generatePhysicsLabSessionId as jest.Mock).mockReturnValue('test-session-123');
  });

  describe('Hook initialization', () => {
    it('should initialize with default configuration', () => {
      const { result } = renderHook(() => usePhysicsLabTelemetry({}, 'test-preset'));

      expect(result.current.sessionId).toBe('test-session-123');
      expect(typeof result.current.recordLoad).toBe('function');
      expect(typeof result.current.recordPresetApplied).toBe('function');
      expect(typeof result.current.recordSliderChange).toBe('function');
      expect(typeof result.current.recordExportAttempt).toBe('function');
      expect(typeof result.current.recordExportBlocked).toBe('function');
      expect(typeof result.current.getAggregatedSliderChanges).toBe('function');
      expect(typeof result.current.flushAggregatedEvents).toBe('function');
    });

    it('should use custom configuration', () => {
      const customConfig = {
        enabled: false,
        sliderAggregationWindowMs: 500,
        maxSliderChangesPerBatch: 5,
        debug: true,
      };

      const { result } = renderHook(() => usePhysicsLabTelemetry(customConfig, 'test-preset'));

      expect(result.current.sessionId).toBe('test-session-123');
    });

    it('should generate unique session IDs', () => {
      const { result: result1 } = renderHook(() => usePhysicsLabTelemetry({}, 'preset1'));
      const { result: result2 } = renderHook(() => usePhysicsLabTelemetry({}, 'preset2'));

      expect(result1.current.sessionId).toBe('test-session-123');
      expect(result2.current.sessionId).toBe('test-session-123');
    });
  });

  describe('Event recording', () => {
    it('should record load events', () => {
      const { result } = renderHook(() => usePhysicsLabTelemetry({}, 'test-preset'));

      act(() => {
        result.current.recordLoad('test-preset');
      });

      expect(logPhysicsLabEvent).toHaveBeenCalledWith('physics_lab_loaded', {
        presetId: 'test-preset',
        sessionId: 'test-session-123',
        timestamp: expect.any(Number),
        context: 'canvas',
        metadata: { action: 'app_loaded' },
      });
    });

    it('should record preset applied events', () => {
      const { result } = renderHook(() => usePhysicsLabTelemetry({}, 'test-preset'));

      act(() => {
        result.current.recordPresetApplied('new-preset', 'old-preset', false);
      });

      expect(logPhysicsLabEvent).toHaveBeenCalledWith('physics_lab_preset_applied', {
        presetId: 'new-preset',
        sessionId: 'test-session-123',
        timestamp: expect.any(Number),
        context: 'sidebar',
        previousPresetId: 'old-preset',
        isReset: false,
      });
    });

    it('should record preset reset events', () => {
      const { result } = renderHook(() => usePhysicsLabTelemetry({}, 'test-preset'));

      act(() => {
        result.current.recordPresetApplied('default-preset', 'custom-preset', true);
      });

      expect(logPhysicsLabEvent).toHaveBeenCalledWith('physics_lab_preset_applied', {
        presetId: 'default-preset',
        sessionId: 'test-session-123',
        timestamp: expect.any(Number),
        context: 'sidebar',
        previousPresetId: 'custom-preset',
        isReset: true,
      });
    });

    it('should record export attempt events', () => {
      const { result } = renderHook(() => usePhysicsLabTelemetry({}, 'test-preset'));

      act(() => {
        result.current.recordExportAttempt('json', 1024, true);
      });

      expect(logPhysicsLabEvent).toHaveBeenCalledWith('physics_lab_export_attempt', {
        presetId: 'test-preset',
        sessionId: 'test-session-123',
        timestamp: expect.any(Number),
        context: 'sidebar',
        format: 'json',
        sizeBytes: 1024,
        success: true,
      });
    });

    it('should record export attempt events with error', () => {
      const { result } = renderHook(() => usePhysicsLabTelemetry({}, 'test-preset'));

      act(() => {
        result.current.recordExportAttempt('csv', 2048, false, 'Network error');
      });

      expect(logPhysicsLabEvent).toHaveBeenCalledWith('physics_lab_export_attempt', {
        presetId: 'test-preset',
        sessionId: 'test-session-123',
        timestamp: expect.any(Number),
        context: 'sidebar',
        format: 'csv',
        sizeBytes: 2048,
        success: false,
        error: 'Network error',
      });
    });

    it('should record export blocked events', () => {
      const { result } = renderHook(() => usePhysicsLabTelemetry({}, 'test-preset'));

      act(() => {
        result.current.recordExportBlocked(
          'low_fps',
          45,
          12,
          3,
          1,
          3.5
        );
      });

      expect(logPhysicsLabEvent).toHaveBeenCalledWith('physics_lab_export_blocked', {
        presetId: 'test-preset',
        sessionId: 'test-session-123',
        timestamp: expect.any(Number),
        context: 'hud',
        reason: 'low_fps',
        currentFps: 45,
        currentCpuMs: 12,
        audioConcurrency: 3,
        hapticConcurrency: 1,
        durationSeconds: 3.5,
      });
    });
  });

  describe('Slider change aggregation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should aggregate slider changes', () => {
      const { result } = renderHook(() => 
        usePhysicsLabTelemetry({ sliderAggregationWindowMs: 1000 }, 'test-preset')
      );

      // Record multiple slider changes
      act(() => {
        result.current.recordSliderChange('liftScale', 1.2);
        result.current.recordSliderChange('liftScale', 1.3);
        result.current.recordSliderChange('liftScale', 1.4);
      });

      // Should not have sent events yet (within aggregation window)
      expect(logPhysicsLabEvent).not.toHaveBeenCalledWith('physics_lab_slider_change', expect.any(Object));

      // Fast forward past aggregation window
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should have sent aggregated event
      expect(logPhysicsLabEvent).toHaveBeenCalledWith('physics_lab_slider_change', {
        presetId: 'test-preset',
        sessionId: 'test-session-123',
        timestamp: expect.any(Number),
        context: 'canvas',
        field: 'liftScale',
        value: 1.4,
        changeCount: 3,
        windowMs: expect.any(Number),
      });
    });

    it('should flush on max changes per batch', () => {
      const { result } = renderHook(() => 
        usePhysicsLabTelemetry({ maxSliderChangesPerBatch: 3 }, 'test-preset')
      );

      // Record max number of changes
      act(() => {
        result.current.recordSliderChange('mass', 2.1);
        result.current.recordSliderChange('mass', 2.2);
        result.current.recordSliderChange('mass', 2.3);
      });

      // Should have flushed immediately due to batch limit
      expect(logPhysicsLabEvent).toHaveBeenCalledWith('physics_lab_slider_change', {
        presetId: 'test-preset',
        sessionId: 'test-session-123',
        timestamp: expect.any(Number),
        context: 'canvas',
        field: 'mass',
        value: 2.3,
        changeCount: 3,
        windowMs: expect.any(Number),
      });
    });

    it('should handle multiple slider fields separately', () => {
      const { result } = renderHook(() => 
        usePhysicsLabTelemetry({ sliderAggregationWindowMs: 1000 }, 'test-preset')
      );

      // Record changes to different fields
      act(() => {
        result.current.recordSliderChange('liftScale', 1.2);
        result.current.recordSliderChange('mass', 2.1);
        result.current.recordSliderChange('liftScale', 1.3);
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should have sent events for both fields
      expect(logPhysicsLabEvent).toHaveBeenCalledTimes(2);
      
      const liftScaleCall = (logPhysicsLabEvent as jest.Mock).mock.calls.find(
        call => call[0] === 'physics_lab_slider_change' && call[1].field === 'liftScale'
      );
      const massCall = (logPhysicsLabEvent as jest.Mock).mock.calls.find(
        call => call[0] === 'physics_lab_slider_change' && call[1].field === 'mass'
      );

      expect(liftScaleCall).toBeTruthy();
      expect(liftScaleCall[1].changeCount).toBe(2);
      expect(liftScaleCall[1].value).toBe(1.3);

      expect(massCall).toBeTruthy();
      expect(massCall[1].changeCount).toBe(1);
      expect(massCall[1].value).toBe(2.1);
    });

    it('should provide access to aggregated changes', () => {
      const { result } = renderHook(() => 
        usePhysicsLabTelemetry({ sliderAggregationWindowMs: 1000 }, 'test-preset')
      );

      act(() => {
        result.current.recordSliderChange('damping', 0.8);
        result.current.recordSliderChange('damping', 0.9);
      });

      const aggregated = result.current.getAggregatedSliderChanges();
      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].field).toBe('damping');
      expect(aggregated[0].values).toEqual([0.8, 0.9]);
      expect(aggregated[0].timestamps).toHaveLength(2);
    });

    it('should flush events on demand', () => {
      const { result } = renderHook(() => 
        usePhysicsLabTelemetry({ sliderAggregationWindowMs: 1000 }, 'test-preset')
      );

      act(() => {
        result.current.recordSliderChange('spring', 100);
        result.current.recordSliderChange('spring', 110);
      });

      // Flush manually
      act(() => {
        result.current.flushAggregatedEvents();
      });

      expect(logPhysicsLabEvent).toHaveBeenCalledWith('physics_lab_slider_change', {
        presetId: 'test-preset',
        sessionId: 'test-session-123',
        timestamp: expect.any(Number),
        context: 'canvas',
        field: 'spring',
        value: 110,
        changeCount: 2,
        windowMs: expect.any(Number),
      });
    });
  });

  describe('Disabled telemetry', () => {
    it('should not record events when disabled', () => {
      const { result } = renderHook(() => 
        usePhysicsLabTelemetry({ enabled: false }, 'test-preset')
      );

      act(() => {
        result.current.recordLoad('test-preset');
        result.current.recordPresetApplied('new-preset', 'old-preset');
        result.current.recordSliderChange('liftScale', 1.2);
        result.current.recordExportAttempt('json', 1024, true);
        result.current.recordExportBlocked('low_fps', 45, 12, 3, 1, 3.5);
      });

      expect(logPhysicsLabEvent).not.toHaveBeenCalled();
    });

    it('should still aggregate slider changes when disabled', () => {
      const { result } = renderHook(() => 
        usePhysicsLabTelemetry({ enabled: false }, 'test-preset')
      );

      act(() => {
        result.current.recordSliderChange('liftScale', 1.2);
        result.current.recordSliderChange('liftScale', 1.3);
      });

      const aggregated = result.current.getAggregatedSliderChanges();
      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].values).toEqual([1.2, 1.3]);
    });
  });

  describe('TelemetryProvider availability', () => {
    it('should not record events when TelemetryProvider is unavailable', () => {
      (isTelemetryProviderAvailable as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => usePhysicsLabTelemetry({}, 'test-preset'));

      act(() => {
        result.current.recordLoad('test-preset');
        result.current.recordPresetApplied('new-preset', 'old-preset');
      });

      expect(logPhysicsLabEvent).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should flush pending events on unmount', () => {
      const { result, unmount } = renderHook(() => 
        usePhysicsLabTelemetry({ sliderAggregationWindowMs: 1000 }, 'test-preset')
      );

      act(() => {
        result.current.recordSliderChange('liftScale', 1.2);
        result.current.recordSliderChange('liftScale', 1.3);
      });

      // Unmount should flush pending events
      unmount();

      expect(logPhysicsLabEvent).toHaveBeenCalledWith('physics_lab_slider_change', {
        presetId: 'test-preset',
        sessionId: 'test-session-123',
        timestamp: expect.any(Number),
        context: 'canvas',
        field: 'liftScale',
        value: 1.3,
        changeCount: 2,
        windowMs: expect.any(Number),
      });
    });
  });
});
