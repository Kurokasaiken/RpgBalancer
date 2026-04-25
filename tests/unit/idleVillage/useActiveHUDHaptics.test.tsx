/**
 * Tests for Active HUD Haptics & Sound System
 */

import { renderHook, act } from '@testing-library/react';
import { useActiveHUDHaptics } from '@/ui/idleVillage/hooks/useActiveHUDHaptics';
import type { ActiveHUDActivityViewModel } from '@/ui/idleVillage/hooks/useActiveHUDState';

// Mock navigator.vibrate
const mockVibrate = jest.fn();
Object.defineProperty(navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
});

// Mock AudioContext
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    frequency: { value: 440 },
    type: 'sine',
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { 
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
    connect: jest.fn(),
  })),
  destination: {},
  state: 'suspended',
  resume: jest.fn(),
  close: jest.fn(),
};

Object.defineProperty(window, 'AudioContext', {
  value: jest.fn(() => mockAudioContext),
  writable: true,
});

Object.defineProperty(window, 'webkitAudioContext', {
  value: jest.fn(() => mockAudioContext),
  writable: true,
});

describe('useActiveHUDHaptics', () => {
  const mockActivities: ActiveHUDActivityViewModel[] = [
    {
      key: 'activity-1',
      activityType: 'job',
      label: 'Forest Work',
      icon: '🌲',
      residentId: 'resident-1',
      residentName: 'Alice',
      progress: 0.5,
      remainingSeconds: 30,
      status: 'running',
      visualVariant: 'azure',
      scheduledId: 'scheduled-1',
      activityId: 'forest-work',
    },
    {
      key: 'activity-2',
      activityType: 'quest',
      label: 'Dragon Hunt',
      icon: '🐉',
      residentId: 'resident-2',
      residentName: 'Bob',
      progress: 0.8,
      remainingSeconds: 15,
      status: 'running',
      visualVariant: 'ember',
      scheduledId: 'scheduled-2',
      activityId: 'dragon-hunt',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockVibrate.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic functionality', () => {
    it('should initialize with default config', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
      }));

      expect(result.current.isHapticsAvailable).toBe(true);
      expect(result.current.isAudioAvailable).toBe(true);
      expect(result.current.config.global.enabled).toBe(true);
      expect(result.current.config.audio.enabled).toBe(false); // Disabled by default
    });

    it('should disable haptics when enabled is false', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: false,
        testMode: false,
      }));

      expect(result.current.isHapticsAvailable).toBe(false);
      expect(result.current.isAudioAvailable).toBe(false);
    });

    it('should use test mode config when testMode is true', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: true,
      }));

      expect(result.current.config.global.intensity).toBe(0.1); // Very low intensity for tests
      expect(result.current.config.audio.enabled).toBe(false); // Always disabled in tests
    });
  });

  describe('Haptic triggering', () => {
    it('should trigger card_select haptic', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
      }));

      act(() => {
        result.current.triggerHaptic('card_select', mockActivities[0]);
      });

      expect(mockVibrate).toHaveBeenCalledWith(expect.arrayContaining([10, 3, 5, 1]));
    });

    it('should trigger card_hover haptic', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
      }));

      act(() => {
        result.current.triggerHaptic('card_hover');
      });

      expect(mockVibrate).toHaveBeenCalledWith([5, 1]);
    });

    it('should trigger activity_complete haptic', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
      }));

      act(() => {
        result.current.triggerHaptic('activity_complete', mockActivities[0]);
      });

      expect(mockVibrate).toHaveBeenCalledWith(expect.arrayContaining([30, 8, 20, 4, 10, 2]));
    });

    it('should trigger custom haptic pattern', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
      }));

      act(() => {
        result.current.triggerCustomHaptic([[50, 0.8], [25, 0.4]]);
      });

      expect(mockVibrate).toHaveBeenCalledWith([50, 15, 25, 7.5]);
    });

    it('should respect cooldown period', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
      }));

      // First trigger
      act(() => {
        result.current.triggerHaptic('card_select');
      });

      expect(mockVibrate).toHaveBeenCalledTimes(1);

      // Second trigger within cooldown should be ignored
      act(() => {
        result.current.triggerHaptic('card_select');
      });

      expect(mockVibrate).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should not trigger haptics when disabled', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: false,
        testMode: false,
      }));

      act(() => {
        result.current.triggerHaptic('card_select');
      });

      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('should handle disabled patterns gracefully', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
        configOverride: {
          patterns: {
            card_select: {
              ...result.current.config.patterns.card_select,
              haptic: {
                ...result.current.config.patterns.card_select.haptic,
                enabled: false,
              },
            },
          },
        },
      }));

      act(() => {
        result.current.triggerHaptic('card_select');
      });

      expect(mockVibrate).not.toHaveBeenCalled();
    });
  });

  describe('Audio functionality', () => {
    it('should not play audio when disabled', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
      }));

      act(() => {
        result.current.triggerHaptic('activity_complete');
      });

      // Audio is disabled by default, so no audio should play
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });

    it('should play audio when enabled and pattern has audio', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
        configOverride: {
          audio: {
            enabled: true,
            masterVolume: 0.5,
          },
          patterns: {
            activity_complete: {
              ...result.current.config.patterns.activity_complete,
              audio: {
                ...result.current.config.patterns.activity_complete.audio,
                enabled: true,
                frequency: 880,
                duration: 200,
              },
            },
          },
        },
      }));

      act(() => {
        result.current.triggerHaptic('activity_complete');
      });

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });
  });

  describe('Config override', () => {
    it('should merge config overrides correctly', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
        configOverride: {
          global: {
            enabled: false,
            intensity: 0.5,
          },
          audio: {
            enabled: true,
            masterVolume: 0.8,
          },
        },
      }));

      expect(result.current.config.global.enabled).toBe(false);
      expect(result.current.config.global.intensity).toBe(0.5);
      expect(result.current.config.audio.enabled).toBe(true);
      expect(result.current.config.audio.masterVolume).toBe(0.8);
    });

    it('should merge pattern overrides correctly', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
        configOverride: {
          patterns: {
            card_select: {
              ...result.current.config.patterns.card_select,
              haptic: {
                ...result.current.config.patterns.card_select.haptic,
                sequence: [[100, 1.0]], // Override sequence
              },
            },
          },
        },
      }));

      expect(result.current.config.patterns.card_select.haptic.sequence).toEqual([[100, 1.0]]);
    });
  });

  describe('Callback functionality', () => {
    it('should call onHapticEvent callback', () => {
      const mockCallback = jest.fn();
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
        onHapticEvent: mockCallback,
      }));

      act(() => {
        result.current.triggerHaptic('card_select', mockActivities[0]);
      });

      expect(mockCallback).toHaveBeenCalledWith('card_select', mockActivities[0]);
    });
  });

  describe('Clear haptics', () => {
    it('should clear all active haptics', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
      }));

      act(() => {
        result.current.clearHaptics();
      });

      expect(mockVibrate).toHaveBeenCalledWith(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty activities array', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: [],
        enabled: true,
        testMode: false,
      }));

      expect(result.current.isHapticsAvailable).toBe(true);
      expect(result.current.isAudioAvailable).toBe(true);
    });

    it('should handle missing activity gracefully', () => {
      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
      }));

      act(() => {
        result.current.triggerHaptic('card_select'); // No activity provided
      });

      expect(mockVibrate).toHaveBeenCalled();
    });

    it('should handle vibrate failure gracefully', () => {
      mockVibrate.mockReturnValue(false);

      const { result } = renderHook(() => useActiveHUDHaptics({
        activities: mockActivities,
        enabled: true,
        testMode: false,
      }));

      act(() => {
        result.current.triggerHaptic('card_select');
      });

      expect(mockVibrate).toHaveBeenCalled();
      // Should not throw error
    });
  });
});
