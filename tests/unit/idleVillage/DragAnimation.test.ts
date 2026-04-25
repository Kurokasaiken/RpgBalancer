import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useDragAnimation,
  useDragAnimationRef,
  type DragAnimationPhase,
} from '../../../src/ui/idleVillage/hooks/useDragAnimation';
import {
  validateDragAnimationConfig,
  mergeDragAnimationConfig,
  buildTransformString,
  buildTransitionString,
  DEFAULT_DRAG_ANIMATION_CONFIG,
  type DragAnimationConfig,
  type TransformConfig,
} from '../../../src/ui/idleVillage/animations/dragAnimationConfig';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('DragAnimationConfig', () => {
  describe('validateDragAnimationConfig', () => {
    it('should validate valid config', () => {
      const result = validateDragAnimationConfig(DEFAULT_DRAG_ANIMATION_CONFIG);
      expect(result).toBeDefined();
      expect(result.enabled).toBe(true);
    });

    it('should reject invalid easing function', () => {
      const invalidConfig = {
        ...DEFAULT_DRAG_ANIMATION_CONFIG,
        pickup: {
          ...DEFAULT_DRAG_ANIMATION_CONFIG.pickup,
          easing: 'invalid-easing',
        },
      };
      
      expect(() => validateDragAnimationConfig(invalidConfig)).toThrow();
    });

    it('should reject invalid duration', () => {
      const invalidConfig = {
        ...DEFAULT_DRAG_ANIMATION_CONFIG,
        pickup: {
          ...DEFAULT_DRAG_ANIMATION_CONFIG.pickup,
          duration: -100,
        },
      };
      
      expect(() => validateDragAnimationConfig(invalidConfig)).toThrow();
    });

    it('should reject invalid transform scale', () => {
      const invalidConfig = {
        ...DEFAULT_DRAG_ANIMATION_CONFIG,
        pickup: {
          ...DEFAULT_DRAG_ANIMATION_CONFIG.pickup,
          transform: {
            ...DEFAULT_DRAG_ANIMATION_CONFIG.pickup.transform,
            scale: 5,
          },
        },
      };
      
      expect(() => validateDragAnimationConfig(invalidConfig)).toThrow();
    });
  });

  describe('mergeDragAnimationConfig', () => {
    it('should merge configs correctly', () => {
      const override: Partial<DragAnimationConfig> = {
        enabled: false,
        pickup: {
          duration: 200,
          easing: 'ease-in',
          delay: 50,
          transform: {
            scale: 1.2,
            rotate: 5,
            translateZ: 15,
            opacity: 0.8,
          },
        },
      };
      
      const result = mergeDragAnimationConfig(DEFAULT_DRAG_ANIMATION_CONFIG, override);
      
      expect(result.enabled).toBe(false);
      expect(result.pickup.duration).toBe(200);
      expect(result.pickup.easing).toBe('ease-in');
      expect(result.pickup.transform.scale).toBe(1.2);
      expect(result.dragging).toEqual(DEFAULT_DRAG_ANIMATION_CONFIG.dragging);
    });
  });

  describe('buildTransformString', () => {
    it('should build transform string with all properties', () => {
      const transform: TransformConfig = {
        scale: 1.1,
        rotate: 5,
        translateZ: 10,
        opacity: 0.9,
      };
      
      const result = buildTransformString(transform);
      expect(result).toBe('scale(1.1) rotate(5deg) translateZ(10px)');
    });

    it('should return none for identity transform', () => {
      const transform: TransformConfig = {
        scale: 1,
        rotate: 0,
        translateZ: 0,
        opacity: 1,
      };
      
      const result = buildTransformString(transform);
      expect(result).toBe('none');
    });

    it('should skip identity values', () => {
      const transform: TransformConfig = {
        scale: 1.1,
        rotate: 0,
        translateZ: 0,
        opacity: 0.9,
      };
      
      const result = buildTransformString(transform);
      expect(result).toBe('scale(1.1)');
    });
  });

  describe('buildTransitionString', () => {
    it('should build transition string with easing', () => {
      const result = buildTransitionString(DEFAULT_DRAG_ANIMATION_CONFIG.pickup);
      expect(result).toContain('transform');
      expect(result).toContain('opacity');
      expect(result).toContain('150ms');
    });

    it('should use correct easing function', () => {
      const result = buildTransitionString({
        duration: 200,
        easing: 'ease-in-quad',
        delay: 0,
        transform: DEFAULT_DRAG_ANIMATION_CONFIG.pickup.transform,
      });
      
      expect(result).toContain('cubic-bezier');
    });
  });
});

describe('useDragAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useDragAnimation());
    
    expect(result.current.state.phase).toBe('idle');
    expect(result.current.state.isAnimating).toBe(false);
    expect(result.current.state.transform).toBe('none');
    expect(result.current.state.opacity).toBe(1);
  });

  it('should transition to pickup phase', async () => {
    const { result } = renderHook(() => useDragAnimation());
    
    act(() => {
      result.current.onPickup();
    });
    
    expect(result.current.state.phase).toBe('pickup');
    expect(result.current.state.isAnimating).toBe(true);
    expect(result.current.state.transform).toContain('scale');
  });

  it('should transition to dragging phase', async () => {
    const { result } = renderHook(() => useDragAnimation());
    
    act(() => {
      result.current.onDragStart();
    });
    
    expect(result.current.state.phase).toBe('dragging');
    expect(result.current.state.isAnimating).toBe(true);
  });

  it('should transition to hover phase', async () => {
    const { result } = renderHook(() => useDragAnimation());
    
    act(() => {
      result.current.onHoverValid();
    });
    
    expect(result.current.state.phase).toBe('hover');
    expect(result.current.state.isAnimating).toBe(true);
  });

  it('should transition to invalid phase', async () => {
    const { result } = renderHook(() => useDragAnimation());
    
    act(() => {
      result.current.onHoverInvalid();
    });
    
    expect(result.current.state.phase).toBe('invalid');
    expect(result.current.state.isAnimating).toBe(true);
    expect(result.current.state.opacity).toBeLessThan(1);
  });

  it('should transition to drop phase', async () => {
    const { result } = renderHook(() => useDragAnimation());
    
    act(() => {
      result.current.onDrop();
    });
    
    expect(result.current.state.phase).toBe('drop');
    expect(result.current.state.isAnimating).toBe(true);
  });

  it('should transition to cancel phase', async () => {
    const { result } = renderHook(() => useDragAnimation());
    
    act(() => {
      result.current.onCancel();
    });
    
    expect(result.current.state.phase).toBe('cancel');
    expect(result.current.state.isAnimating).toBe(true);
  });

  it('should reset to idle state', () => {
    const { result } = renderHook(() => useDragAnimation());
    
    act(() => {
      result.current.onPickup();
    });
    
    expect(result.current.state.phase).toBe('pickup');
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.state.phase).toBe('idle');
    expect(result.current.state.isAnimating).toBe(false);
  });

  it('should emit telemetry event after animation completes', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    (window as any).__TELEMETRY_ENABLED__ = true;
    
    const { result } = renderHook(() => 
      useDragAnimation({ elementId: 'test-element' })
    );
    
    act(() => {
      result.current.onPickup();
      vi.advanceTimersByTime(150);
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Telemetry] iv_drag_animation_played',
      expect.objectContaining({
        phase: 'pickup',
        elementId: 'test-element',
        duration: 150,
      })
    );
    
    consoleSpy.mockRestore();
    delete (window as any).__TELEMETRY_ENABLED__;
  });

  it('should call onAnimationComplete callback', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => 
      useDragAnimation({ onAnimationComplete: onComplete })
    );
    
    act(() => {
      result.current.onPickup();
      vi.advanceTimersByTime(150);
    });
    
    expect(onComplete).toHaveBeenCalledWith('pickup');
  });

  it('should handle custom config', () => {
    const customConfig: Partial<DragAnimationConfig> = {
      pickup: {
        duration: 300,
        easing: 'ease-in-out',
        delay: 0,
        transform: {
          scale: 1.5,
          rotate: 10,
          translateZ: 20,
          opacity: 0.7,
        },
      },
    };
    
    const { result } = renderHook(() => 
      useDragAnimation({ config: customConfig })
    );
    
    act(() => {
      result.current.onPickup();
    });
    
    expect(result.current.state.transform).toContain('scale(1.5)');
    expect(result.current.state.opacity).toBe(0.7);
  });

  it('should apply styles to element', () => {
    const { result } = renderHook(() => useDragAnimation());
    const element = document.createElement('div');
    
    act(() => {
      result.current.onPickup();
    });
    
    act(() => {
      result.current.applyStyles(element);
    });
    
    expect(element.style.transform).toContain('scale');
    expect(element.style.opacity).toBeTruthy();
    expect(element.style.transition).toBeTruthy();
  });

  it('should handle disabled config', () => {
    const { result } = renderHook(() => 
      useDragAnimation({ config: { enabled: false } })
    );
    
    act(() => {
      result.current.onPickup();
    });
    
    expect(result.current.state.phase).toBe('idle');
    expect(result.current.state.isAnimating).toBe(false);
  });

  it('should clear timeout on unmount', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    (window as any).__TELEMETRY_ENABLED__ = true;
    
    const { result, unmount } = renderHook(() => useDragAnimation());
    
    act(() => {
      result.current.onPickup();
    });
    
    unmount();
    
    act(() => {
      vi.advanceTimersByTime(150);
    });
    
    expect(consoleSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
    delete (window as any).__TELEMETRY_ENABLED__;
  });

  it('should handle rapid phase transitions', () => {
    const { result } = renderHook(() => useDragAnimation());
    
    act(() => {
      result.current.onPickup();
      result.current.onDragStart();
      result.current.onHoverValid();
    });
    
    expect(result.current.state.phase).toBe('hover');
  });

  it('should apply GPU acceleration when enabled', () => {
    const { result } = renderHook(() => useDragAnimation());
    const element = document.createElement('div');
    
    act(() => {
      result.current.onPickup();
      result.current.applyStyles(element);
    });
    
    expect(element.style.backfaceVisibility).toBe('hidden');
    expect(element.style.perspective).toBe('1000px');
  });
});

describe('useDragAnimationRef', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide ref and controls', () => {
    const { result } = renderHook(() => useDragAnimationRef());
    
    expect(result.current.ref).toBeDefined();
    expect(result.current.onPickup).toBeDefined();
    expect(result.current.state).toBeDefined();
  });

  it('should auto-apply styles to ref element', () => {
    const { result } = renderHook(() => useDragAnimationRef());
    const element = document.createElement('div');
    
    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    });
    
    act(() => {
      result.current.onPickup();
    });
    
    expect(element.style.transform).toBeTruthy();
  });
});

describe('Animation Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should complete animation within expected duration', () => {
    const { result } = renderHook(() => useDragAnimation());
    
    act(() => {
      result.current.onPickup();
      vi.advanceTimersByTime(150);
    });
    
    expect(result.current.state.isAnimating).toBe(false);
  });

  it('should include duration in telemetry', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    (window as any).__TELEMETRY_ENABLED__ = true;
    
    const { result } = renderHook(() => 
      useDragAnimation({ elementId: 'perf-test' })
    );
    
    act(() => {
      result.current.onPickup();
      vi.advanceTimersByTime(150);
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Telemetry] iv_drag_animation_played',
      expect.objectContaining({
        phase: 'pickup',
        elementId: 'perf-test',
        duration: 150,
      })
    );
    
    consoleSpy.mockRestore();
    delete (window as any).__TELEMETRY_ENABLED__;
  });
});
