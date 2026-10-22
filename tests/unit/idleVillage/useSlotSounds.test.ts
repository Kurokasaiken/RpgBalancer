/**
 * useSlotSounds Hook Test Suite
 * 
 * Tests the slot sound system with AudioContext mocking and fallback handling
 * Covers synthetic sound generation, fallback behavior, and configuration integration
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AudioContext and related APIs for synthetic sound generation
class MockAudioContext {
  destination = {};
  currentTime = 0;
  state = 'running';
  
  createOscillator() {
    return {
      connect: vi.fn(),
      frequency: { 
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      type: 'sine' as OscillatorType,
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  
  createGain() {
    return {
      gain: { 
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }
  
  close() {
    return Promise.resolve();
  }
  
  resume() {
    return Promise.resolve();
  }
  
  suspend() {
    return Promise.resolve();
  }
}

// Mock the global AudioContext
(global as any).AudioContext = MockAudioContext;
(global as any).webkitAudioContext = MockAudioContext;

// Import the hook after mocking globals
import { useSlotSounds, type SlotSoundsConfig } from '@/ui/idleVillage/hooks/useSlotSounds';

describe('useSlotSounds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Hook API', () => {
    it('should return all sound control functions', () => {
      const { result } = renderHook(() => useSlotSounds());
      
      expect(typeof result.current.clank).toBe('function');
      expect(typeof result.current.reject).toBe('function');
      expect(typeof result.current.detach).toBe('function');
      expect(typeof result.current.complete).toBe('function');
      expect(typeof result.current.testAll).toBe('function');
    });

    it('should not throw when calling sound functions', () => {
      const { result } = renderHook(() => useSlotSounds());
      
      expect(() => {
        act(() => {
          result.current.clank();
        });
      }).not.toThrow();
      
      expect(() => {
        act(() => {
          result.current.reject();
        });
      }).not.toThrow();
      
      expect(() => {
        act(() => {
          result.current.detach();
        });
      }).not.toThrow();
      
      expect(() => {
        act(() => {
          result.current.complete();
        });
      }).not.toThrow();
      
      expect(() => {
        act(() => {
          result.current.testAll();
        });
      }).not.toThrow();
    });
  });

  describe('Configuration Options', () => {
    it('should respect enabled flag', () => {
      const { result } = renderHook(() => useSlotSounds({ enabled: false }));
      
      // Should not throw when disabled
      expect(() => {
        act(() => {
          result.current.clank();
        });
      }).not.toThrow();
    });

    it('should respect volume setting', () => {
      const { result } = renderHook(() => useSlotSounds({ volume: 0.5 }));
      
      expect(() => {
        act(() => {
          result.current.clank();
        });
      }).not.toThrow();
    });

    it('should accept custom AudioContext', () => {
      const mockContext = new MockAudioContext();
      const { result } = renderHook(() => useSlotSounds({ audioContext: mockContext }));
      
      expect(() => {
        act(() => {
          result.current.clank();
        });
      }).not.toThrow();
    });
  });

  describe('AudioContext Unavailable', () => {
    beforeEach(() => {
      // Remove AudioContext to simulate unsupported environment
      delete (global as any).AudioContext;
      delete (global as any).webkitAudioContext;
    });

    it('should fallback gracefully when AudioContext is unavailable', () => {
      const { result } = renderHook(() => useSlotSounds());
      
      // Should still provide all functions even when AudioContext unavailable
      expect(typeof result.current.clank).toBe('function');
      expect(typeof result.current.reject).toBe('function');
      expect(typeof result.current.detach).toBe('function');
      expect(typeof result.current.complete).toBe('function');
      expect(typeof result.current.testAll).toBe('function');
    });

    it('should not throw when AudioContext unavailable', () => {
      const { result } = renderHook(() => useSlotSounds());
      
      expect(() => {
        act(() => {
          result.current.clank();
        });
      }).not.toThrow();
      
      expect(() => {
        act(() => {
          result.current.reject();
        });
      }).not.toThrow();
      
      expect(() => {
        act(() => {
          result.current.detach();
        });
      }).not.toThrow();
      
      expect(() => {
        act(() => {
          result.current.complete();
        });
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle AudioContext initialization errors', () => {
      // Mock AudioContext to throw errors
      (global as any).AudioContext = vi.fn().mockImplementation(() => {
        throw new Error('AudioContext not supported');
      });
      
      const { result } = renderHook(() => useSlotSounds());
      
      // Should still provide all functions even when AudioContext fails
      expect(typeof result.current.clank).toBe('function');
      expect(typeof result.current.reject).toBe('function');
      expect(typeof result.current.detach).toBe('function');
      expect(typeof result.current.complete).toBe('function');
      expect(typeof result.current.testAll).toBe('function');
    });

    it('should handle multiple rapid sound calls', () => {
      const { result } = renderHook(() => useSlotSounds());
      
      // Multiple rapid calls should not cause issues
      expect(() => {
        act(() => {
          result.current.clank();
          result.current.reject();
          result.current.detach();
          result.current.complete();
        });
      }).not.toThrow();
    });

    it('should handle testAll sequence', () => {
      const { result } = renderHook(() => useSlotSounds());
      
      expect(() => {
        act(() => {
          result.current.testAll();
        });
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should handle cleanup on unmount', () => {
      const { unmount } = renderHook(() => useSlotSounds());
      
      // Unmount should not throw
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('AudioContext lifecycle (R-248)', () => {
    afterEach(() => {
      /* Restore the plain mock for any suite running after this one. */
      (global as any).AudioContext = MockAudioContext;
      (global as any).webkitAudioContext = MockAudioContext;
    });

    // INV:resident-slot-rack.INV-1 — a fresh AudioContext per cue blocks the
    // main thread on every assign/extract (each DetailSlot mounts the hook):
    // one shared context must serve every cue of every hook instance.
    it('builds one AudioContext shared across plays AND hook instances', async () => {
      let constructed = 0;
      class CountingAudioContext extends MockAudioContext {
        constructor() {
          super();
          constructed += 1;
        }
      }
      (global as any).AudioContext = CountingAudioContext;

      /* The shared context is module-level — a fresh module graph is needed
       * to count its first construction deterministically. */
      vi.resetModules();
      const { useSlotSounds: useSlotSoundsFresh } = await import('@/ui/idleVillage/hooks/useSlotSounds');
      const first = renderHook(() => useSlotSoundsFresh());
      act(() => {
        first.result.current.clank();
        first.result.current.reject();
        first.result.current.detach();
        first.result.current.complete();
      });
      expect(constructed).toBe(1);

      /* A second mounted slot plays through the SAME context — the per-slot
       * construction the Director's probe measured is gone. */
      const second = renderHook(() => useSlotSoundsFresh());
      act(() => {
        second.result.current.clank();
      });
      expect(constructed).toBe(1);
    });

    it('resumes a suspended context instead of building a new one', async () => {
      let constructed = 0;
      let resumed = 0;
      class SuspendedAudioContext extends MockAudioContext {
        state = 'suspended';
        constructor() {
          super();
          constructed += 1;
        }
        resume() {
          resumed += 1;
          return Promise.resolve();
        }
      }
      (global as any).AudioContext = SuspendedAudioContext;

      vi.resetModules();
      const { useSlotSounds: useSlotSoundsFresh } = await import('@/ui/idleVillage/hooks/useSlotSounds');
      const { result } = renderHook(() => useSlotSoundsFresh());
      act(() => {
        result.current.clank();
        result.current.detach();
      });

      expect(constructed).toBe(1);
      expect(resumed).toBeGreaterThan(0);
    });
  });
});
