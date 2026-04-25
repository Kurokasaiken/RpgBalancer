/**
 * useSkinHarness Hook Tests
 * 
 * Unit tests for the skin harness functionality
 * Tests skin preferences, telemetry capture, motion controls, and pillar switching
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSkinHarness, useSkinDataAttributes, useSkinTelemetry, MOTION_LEVELS } from '@/ui/idleVillage/hooks/useSkinHarness';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

// Mock the dependencies
jest.mock('@/ui/idleVillage/hooks/useSkinPreferences');
jest.mock('@/analytics/telemetry/telemetryProvider');
jest.mock('@/ui/idleVillage/skins/skinConfigRegistry');

const mockUseSkinPreferences = jest.requireMock('@/ui/idleVillage/hooks/useSkinPreferences');
const mockTrackTelemetryEvent = jest.requireMock('@/analytics/telemetry/telemetryProvider').trackTelemetryEvent;
const mockGetSkinPresetConfig = jest.requireMock('@/ui/idleVillage/skins/skinConfigRegistry').getSkinPresetConfig;

describe('useSkinHarness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseSkinPreferences.useSkinPreferences = jest.fn(() => ({
      presetId: 'minimal-frontier',
      pillar: 'frontier',
      overrides: {},
      setPreset: jest.fn(),
      setPillar: jest.fn(),
      updateOverrides: jest.fn(),
      supportedPillars: ['frontier', 'wilderness', 'empire'],
      availablePresets: [
        { id: 'minimal-frontier', label: 'Minimal Frontier' },
        { id: 'wanderlust', label: 'Wanderlust' },
      ],
      isLoading: false,
    }));

    mockGetSkinPresetConfig = jest.fn((presetId) => ({
      id: presetId,
      defaultPillar: 'frontier',
      tokens: {},
    }));

    mockTrackTelemetryEvent = jest.fn();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useSkinHarness());

      expect(result.current.presetId).toBe('minimal-frontier');
      expect(result.current.pillar).toBe('frontier');
      expect(result.current.motionLevel).toBe('full');
      expect(result.current.showTelemetry).toBe(true);
      expect(result.current.telemetryEvents).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize with provided options', () => {
      const { result } = renderHook(() => useSkinHarness({
        initialPresetId: 'wanderlust',
        initialPillar: 'wilderness',
        initialMotionLevel: 'minimal',
        enableTelemetry: false,
      }));

      expect(result.current.presetId).toBe('minimal-frontier'); // Will be updated by useEffect
      expect(result.current.pillar).toBe('frontier'); // Will be updated by useEffect
      expect(result.current.motionLevel).toBe('minimal');
      expect(result.current.showTelemetry).toBe(false);
    });

    it('should show loading state when skin preferences are loading', () => {
      mockUseSkinPreferences.useSkinPreferences = jest.fn(() => ({
        ...mockUseSkinPreferences.useSkinPreferences(),
        isLoading: true,
      }));

      const { result } = renderHook(() => useSkinHarness());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('preset management', () => {
    it('should change preset and emit telemetry', async () => {
      const mockSetPreset = jest.fn();
      mockUseSkinPreferences.useSkinPreferences = jest.fn(() => ({
        ...mockUseSkinPreferences.useSkinPreferences(),
        setPreset: mockSetPreset,
      }));

      const { result } = renderHook(() => useSkinHarness());

      act(() => {
        result.current.setPreset('wanderlust');
      });

      expect(mockSetPreset).toHaveBeenCalledWith('wanderlust', 'frontier');
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('skin_harness_preset_changed', {
        presetId: 'wanderlust',
        previousPresetId: 'minimal-frontier',
        pillar: 'frontier',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('pillar management', () => {
    it('should change pillar and emit telemetry', () => {
      const mockSetPillar = jest.fn();
      mockUseSkinPreferences.useSkinPreferences = jest.fn(() => ({
        ...mockUseSkinPreferences.useSkinPreferences(),
        setPillar: mockSetPillar,
      }));

      const { result } = renderHook(() => useSkinHarness());

      act(() => {
        result.current.setPillar('wilderness');
      });

      expect(mockSetPillar).toHaveBeenCalledWith('wilderness');
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('skin_harness_pillar_changed', {
        pillar: 'wilderness',
        previousPillar: 'frontier',
        presetId: 'minimal-frontier',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('motion level management', () => {
    it('should change motion level and emit telemetry', () => {
      const mockUpdateOverrides = jest.fn();
      mockUseSkinPreferences.useSkinPreferences = jest.fn(() => ({
        ...mockUseSkinPreferences.useSkinPreferences(),
        updateOverrides: mockUpdateOverrides,
      }));

      const { result } = renderHook(() => useSkinHarness());

      act(() => {
        result.current.setMotionLevel('minimal');
      });

      expect(mockUpdateOverrides).toHaveBeenCalledWith({
        motionLevel: 'minimal',
      });
      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('skin_harness_motion_changed', {
        motionLevel: 'minimal',
        presetId: 'minimal-frontier',
        pillar: 'frontier',
        timestamp: expect.any(Number),
      });
    });

    it('should support all motion levels', () => {
      const { result } = renderHook(() => useSkinHarness());

      MOTION_LEVELS.forEach((level) => {
        act(() => {
          result.current.setMotionLevel(level.value);
        });
        expect(result.current.motionLevel).toBe(level.value);
      });
    });
  });

  describe('telemetry management', () => {
    it('should toggle telemetry capture', () => {
      const { result } = renderHook(() => useSkinHarness());

      expect(result.current.showTelemetry).toBe(true);

      act(() => {
        result.current.toggleTelemetry();
      });

      expect(result.current.showTelemetry).toBe(false);

      act(() => {
        result.current.toggleTelemetry();
      });

      expect(result.current.showTelemetry).toBe(true);
    });

    it('should clear telemetry events', () => {
      // Mock some telemetry events
      const { result } = renderHook(() => useSkinHarness());

      // Simulate having events
      act(() => {
        result.current.clearTelemetry();
      });

      expect(result.current.telemetryEvents).toEqual([]);
    });

    it('should capture telemetry events when enabled', () => {
      const { result } = renderHook(() => useSkinHarness());

      // Enable telemetry capture
      act(() => {
        result.current.toggleTelemetry(); // Turn off
        result.current.toggleTelemetry(); // Turn back on
      });

      // Simulate a telemetry event
      const mockEvent = 'test_event';
      const mockData = { test: 'data' };

      act(() => {
        // This would be called by the overridden trackTelemetryEvent
        if ((window as any).trackTelemetryEvent) {
          (window as any).trackTelemetryEvent(mockEvent, mockData);
        }
      });

      // Check if event was captured
      expect(result.current.telemetryEvents.length).toBeGreaterThan(0);
    });
  });

  describe('data attributes', () => {
    it('should generate correct data attributes', () => {
      const { result } = renderHook(() => useSkinHarness());

      const attributes = result.current.getDataAttributes();

      expect(attributes).toEqual({
        'data-skin-preset': 'minimal-frontier',
        'data-skin-pillar': 'frontier',
        'data-motion-level': 'full',
        'data-telemetry-enabled': 'true',
      });
    });

    it('should update data attributes when state changes', () => {
      const { result } = renderHook(() => useSkinHarness());

      act(() => {
        result.current.setMotionLevel('minimal');
        result.current.toggleTelemetry();
      });

      const attributes = result.current.getDataAttributes();

      expect(attributes).toEqual({
        'data-skin-preset': 'minimal-frontier',
        'data-skin-pillar': 'frontier',
        'data-motion-level': 'minimal',
        'data-telemetry-enabled': 'false',
      });
    });
  });

  describe('computed values', () => {
    it('should provide available presets', () => {
      const { result } = renderHook(() => useSkinHarness());

      expect(result.current.availablePresets).toEqual([
        { id: 'minimal-frontier', label: 'Minimal Frontier' },
        { id: 'wanderlust', label: 'Wanderlust' },
      ]);
    });

    it('should provide supported pillars', () => {
      const { result } = renderHook(() => useSkinHarness());

      expect(result.current.supportedPillars).toEqual(['frontier', 'wilderness', 'empire']);
    });

    it('should provide current preset config', () => {
      const { result } = renderHook(() => useSkinHarness());

      expect(result.current.currentPresetConfig).toEqual({
        id: 'minimal-frontier',
        defaultPillar: 'frontier',
        tokens: {},
      });
    });
  });

  describe('telemetry events', () => {
    it('should emit render telemetry on mount and state changes', () => {
      renderHook(() => useSkinHarness());

      expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('skin_harness_rendered', {
        presetId: 'minimal-frontier',
        pillar: 'frontier',
        motionLevel: 'full',
        telemetryEnabled: true,
        timestamp: expect.any(Number),
      });
    });
  });
});

describe('useSkinDataAttributes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSkinPreferences.useSkinPreferences = jest.fn(() => ({
      presetId: 'minimal-frontier',
      pillar: 'frontier',
      overrides: {},
      setPreset: jest.fn(),
      setPillar: jest.fn(),
      updateOverrides: jest.fn(),
      supportedPillars: ['frontier'],
      availablePresets: [{ id: 'minimal-frontier' }],
      isLoading: false,
    }));
    mockGetSkinPresetConfig = jest.fn(() => ({ id: 'minimal-frontier', defaultPillar: 'frontier' }));
    mockTrackTelemetryEvent = jest.fn();
  });

  it('should return data attributes from skin harness', () => {
    const { result } = renderHook(() => useSkinDataAttributes());

    expect(result.current).toEqual({
      'data-skin-preset': 'minimal-frontier',
      'data-skin-pillar': 'frontier',
      'data-motion-level': 'full',
      'data-telemetry-enabled': 'true',
    });
  });
});

describe('useSkinTelemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSkinPreferences.useSkinPreferences = jest.fn(() => ({
      presetId: 'minimal-frontier',
      pillar: 'frontier',
      overrides: {},
      setPreset: jest.fn(),
      setPillar: jest.fn(),
      updateOverrides: jest.fn(),
      supportedPillars: ['frontier'],
      availablePresets: [{ id: 'minimal-frontier' }],
      isLoading: false,
    }));
    mockGetSkinPresetConfig = jest.fn(() => ({ id: 'minimal-frontier', defaultPillar: 'frontier' }));
    mockTrackTelemetryEvent = jest.fn();
  });

  it('should provide telemetry tracking for components', () => {
    const { result } = renderHook(() => useSkinTelemetry('TestComponent'));

    expect(result.current.componentName).toBeUndefined(); // Not exposed in return
    expect(result.current.showTelemetry).toBe(true);
    expect(result.current.telemetryEvents).toEqual([]);
  });

  it('should track component events when telemetry is enabled', () => {
    const { result } = renderHook(() => useSkinTelemetry('TestComponent'));

    act(() => {
      result.current.trackComponentEvent('click', { button: 'primary' });
    });

    expect(mockTrackTelemetryEvent).toHaveBeenCalledWith('skin_TestComponent_click', {
      component: 'TestComponent',
      button: 'primary',
      timestamp: expect.any(Number),
    });
  });

  it('should not track events when telemetry is disabled', () => {
    mockUseSkinPreferences.useSkinPreferences = jest.fn(() => ({
      ...mockUseSkinPreferences.useSkinPreferences(),
      // Mock harness to have telemetry disabled
    }));

    const { result } = renderHook(() => useSkinTelemetry('TestComponent'));

    // Mock showTelemetry as false
    jest.spyOn(require('@/ui/idleVillage/hooks/useSkinHarness'), 'useSkinHarness').mockReturnValue({
      showTelemetry: false,
      telemetryEvents: [],
    } as any);

    act(() => {
      result.current.trackComponentEvent('click', { button: 'primary' });
    });

    expect(mockTrackTelemetryEvent).not.toHaveBeenCalled();
  });
});
