/**
 * useSlottedMedalBehavior Hook Test Suite
 * 
 * Tests the complete behavior state machine for slotted medals
 * Covers state transitions, timer management, config integration, and animation controls
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSlottedMedalBehavior, type MedalBehaviorConfig } from '@/ui/idleVillage/hooks/useSlottedMedalBehavior';

// Mock dependencies
vi.mock('@/balancing/hooks/useIdleVillageConfig', () => ({
  useIdleVillageConfig: vi.fn(() => ({
    config: {
      slottedMedal: {
        behavior: {
          resistDurationMs: 1500,
          springStiffness: 400,
          springDamping: 25,
          enableShake: true,
          enableSound: true,
          magneticPull: {
            enabled: true,
            elasticity: 1.2,
          },
        },
      },
    },
  })),
}));

// Mock framer-motion animation controls
vi.mock('framer-motion', () => ({
  animationControls: () => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    stopAll: vi.fn(),
    mount: vi.fn(),
    unmount: vi.fn(),
  }),
  useAnimationControls: () => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    stopAll: vi.fn(),
    mount: vi.fn(),
    unmount: vi.fn(),
  }),
}));

describe('useSlottedMedalBehavior', () => {
  let mockConfig: MedalBehaviorConfig;

  beforeEach(() => {
    vi.useFakeTimers();
    mockConfig = {
      resistDurationMs: 1500,
      springStiffness: 400,
      springDamping: 25,
      enableShake: true,
      enableSound: true,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start in empty state', () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      expect(result.current.state).toBe('empty');
      expect(typeof result.current.animationControls).toBe('object');
    });

    it('should provide all control functions', () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      expect(typeof result.current.springToCenter).toBe('function');
      expect(typeof result.current.triggerShake).toBe('function');
      expect(typeof result.current.triggerClank).toBe('function');
      expect(typeof result.current.resistStart).toBe('function');
      expect(typeof result.current.triggerDetach).toBe('function');
      expect(typeof result.current.handleDrop).toBe('function');
      expect(typeof result.current.handleReject).toBe('function');
      expect(typeof result.current.handleComplete).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('State Transitions', () => {
    it('should transition from empty to landing on drop', () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      act(() => {
        result.current.handleDrop('resident-123');
      });
      
      expect(result.current.state).toBe('landing');
    });

    it('should transition from landing to active after springToCenter', async () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // First drop to get to landing state
      act(() => {
        result.current.handleDrop('resident-123');
      });
      expect(result.current.state).toBe('landing');
      
      // Then spring to center
      await act(async () => {
        await result.current.springToCenter();
      });
      
      expect(result.current.state).toBe('active');
    });

    it('should transition from active to locked on resist start', () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // Get to active state
      act(() => {
        result.current.handleDrop('resident-123');
      });
      act(() => {
        result.current.springToCenter();
      });
      expect(result.current.state).toBe('active');
      
      // Start resistance
      act(() => {
        result.current.resistStart();
      });
      
      expect(result.current.state).toBe('locked');
    });

    it('should transition from locked to unlocking after resist duration', () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // Get to locked state
      act(() => {
        result.current.handleDrop('resident-123');
      });
      act(() => {
        result.current.springToCenter();
      });
      act(() => {
        result.current.resistStart();
      });
      expect(result.current.state).toBe('locked');
      
      // Fast-forward past resist duration
      act(() => {
        vi.advanceTimersByTime(1600); // 1500ms + buffer
      });
      
      expect(result.current.state).toBe('unlocking');
    });

    it('should transition from unlocking to empty on detach completion', async () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // Get to unlocking state
      act(() => {
        result.current.handleDrop('resident-123');
      });
      act(() => {
        result.current.springToCenter();
      });
      act(() => {
        result.current.resistStart();
      });
      act(() => {
        vi.advanceTimersByTime(1600);
      });
      expect(result.current.state).toBe('unlocking');
      
      // Complete detach
      await act(async () => {
        await result.current.triggerDetach();
      });
      
      expect(result.current.state).toBe('empty');
    });

    it('should transition from active to empty on completion', () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // Get to active state
      act(() => {
        result.current.handleDrop('resident-123');
      });
      act(() => {
        result.current.springToCenter();
      });
      expect(result.current.state).toBe('active');
      
      // Complete activity
      act(() => {
        result.current.handleComplete();
      });
      
      expect(result.current.state).toBe('empty');
    });

    it('should reset to empty from any state', () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // Get to active state
      act(() => {
        result.current.handleDrop('resident-123');
      });
      act(() => {
        result.current.springToCenter();
      });
      expect(result.current.state).toBe('active');
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.state).toBe('empty');
    });
  });

  describe('Timer Management', () => {
    it('should use config resist duration', () => {
      const customConfig = { ...mockConfig, resistDurationMs: 2000 };
      const { result } = renderHook(() => useSlottedMedalBehavior(customConfig));
      
      // Get to locked state
      act(() => {
        result.current.handleDrop('resident-123');
      });
      act(() => {
        result.current.springToCenter();
      });
      act(() => {
        result.current.resistStart();
      });
      expect(result.current.state).toBe('locked');
      
      // Should still be locked before custom duration
      act(() => {
        vi.advanceTimersByTime(1900);
      });
      expect(result.current.state).toBe('locked');
      
      // Should transition after custom duration
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.state).toBe('unlocking');
    });

    it('should clear timer on reset', () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // Start resistance timer
      act(() => {
        result.current.handleDrop('resident-123');
      });
      act(() => {
        result.current.springToCenter();
      });
      act(() => {
        result.current.resistStart();
      });
      expect(result.current.state).toBe('locked');
      
      // Reset before timer completes
      act(() => {
        result.current.reset();
      });
      
      // Fast-forward - should not transition because timer was cleared
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.state).toBe('empty');
    });
  });

  describe('Animation Controls', () => {
    it('should call animation controls for state transitions', async () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));

      // Move to landing state first so springToCenter is allowed
      act(() => {
        result.current.handleDrop('resident-123');
      });
      expect(result.current.state).toBe('landing');

      // Mock animation control methods
      const mockStart = vi.fn().mockResolvedValue(undefined);
      result.current.animationControls.start = mockStart;

      // Spring to center should trigger animation
      await act(async () => {
        await result.current.springToCenter();
      });

      expect(mockStart).toHaveBeenCalled();
    });

    it('should handle shake animation', async () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      const mockStart = vi.fn().mockResolvedValue(undefined);
      result.current.animationControls.start = mockStart;
      
      await act(async () => {
        await result.current.triggerShake('assign');
      });
      
      expect(mockStart).toHaveBeenCalled();
    });

    it('should handle clank effect', () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // Clank should not throw and should handle gracefully
      expect(() => {
        act(() => {
          result.current.triggerClank();
        });
      }).not.toThrow();
    });
  });

  describe('Config Integration', () => {
    it('should use default config when none provided', () => {
      const { result } = renderHook(() => useSlottedMedalBehavior());
      
      expect(result.current.state).toBe('empty');
      expect(typeof result.current.springToCenter).toBe('function');
    });

    it('should merge partial config with defaults', () => {
      const partialConfig = { resistDurationMs: 3000 };
      const { result } = renderHook(() => useSlottedMedalBehavior(partialConfig));
      
      // Should still work with partial config
      act(() => {
        result.current.handleDrop('resident-123');
      });
      act(() => {
        result.current.springToCenter();
      });
      act(() => {
        result.current.resistStart();
      });
      
      // Should use custom duration
      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(result.current.state).toBe('locked');
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.state).toBe('unlocking');
    });

    it('should handle invalid config gracefully', () => {
      const invalidConfig = { resistDurationMs: -100 };
      const { result } = renderHook(() => useSlottedMedalBehavior(invalidConfig));
      
      // Should still work without throwing
      expect(() => {
        act(() => {
          result.current.handleDrop('resident-123');
        });
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle animation control errors gracefully', async () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // Mock animation control to throw error
      result.current.animationControls.start = vi.fn().mockRejectedValue(new Error('Animation failed'));
      
      // Should not throw unhandled promise rejection
      await act(async () => {
        try {
          await result.current.springToCenter();
        } catch (error) {
          // Expected to be handled internally
        }
      });
    });

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // Rapid state changes should not cause issues
      expect(() => {
        act(() => {
          result.current.handleDrop('resident-123');
          result.current.handleReject();
          result.current.reset();
          result.current.handleDrop('resident-456');
        });
      }).not.toThrow();
    });
  });

  describe('Sound Integration', () => {
    it('should handle sound when enabled', () => {
      const configWithSound = { ...mockConfig, enableSound: true };
      const { result } = renderHook(() => useSlottedMedalBehavior(configWithSound));
      
      // Sound-related operations should not throw
      expect(() => {
        act(() => {
          result.current.triggerClank();
        });
      }).not.toThrow();
    });

    it('should handle sound when disabled', () => {
      const configWithoutSound = { ...mockConfig, enableSound: false };
      const { result } = renderHook(() => useSlottedMedalBehavior(configWithoutSound));
      
      // Should still work without sound
      expect(() => {
        act(() => {
          result.current.triggerClank();
        });
      }).not.toThrow();
    });
  });

  describe('Shake Animation', () => {
    it('should handle assign shake', async () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      const mockStart = vi.fn().mockResolvedValue(undefined);
      result.current.animationControls.start = mockStart;
      
      await act(async () => {
        await result.current.triggerShake('assign');
      });
      
      expect(mockStart).toHaveBeenCalled();
    });

    it('should handle reject shake', async () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      const mockStart = vi.fn().mockResolvedValue(undefined);
      result.current.animationControls.start = mockStart;
      
      await act(async () => {
        await result.current.triggerShake('reject');
      });
      
      expect(mockStart).toHaveBeenCalled();
    });

    it('should handle shake when disabled', async () => {
      const configWithoutShake = { ...mockConfig, enableShake: false };
      const { result } = renderHook(() => useSlottedMedalBehavior(configWithoutShake));
      
      const mockStart = vi.fn().mockResolvedValue(undefined);
      result.current.animationControls.start = mockStart;
      
      await act(async () => {
        await result.current.triggerShake('assign');
      });
      
      // Should still attempt animation even when disabled in config
      expect(mockStart).toHaveBeenCalled();
    });
  });

  describe('Complete Workflow', () => {
    it('should handle complete drop-to-active-to-completion workflow', async () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // Start: empty
      expect(result.current.state).toBe('empty');
      
      // Drop: empty -> landing
      act(() => {
        result.current.handleDrop('resident-123');
      });
      expect(result.current.state).toBe('landing');
      
      // Spring: landing -> active
      await act(async () => {
        await result.current.springToCenter();
      });
      expect(result.current.state).toBe('active');
      
      // Complete: active -> empty
      act(() => {
        result.current.handleComplete();
      });
      expect(result.current.state).toBe('empty');
    });

    it('should handle complete drop-to-active-to-detach workflow', async () => {
      const { result } = renderHook(() => useSlottedMedalBehavior(mockConfig));
      
      // Drop and activate
      act(() => {
        result.current.handleDrop('resident-123');
      });
      await act(async () => {
        await result.current.springToCenter();
      });
      expect(result.current.state).toBe('active');
      
      // Start resistance: active -> locked
      act(() => {
        result.current.resistStart();
      });
      expect(result.current.state).toBe('locked');
      
      // Wait for resistance: locked -> unlocking
      act(() => {
        vi.advanceTimersByTime(1600);
      });
      expect(result.current.state).toBe('unlocking');
      
      // Complete detach: unlocking -> empty
      await act(async () => {
        await result.current.triggerDetach();
      });
      expect(result.current.state).toBe('empty');
    });
  });
});
