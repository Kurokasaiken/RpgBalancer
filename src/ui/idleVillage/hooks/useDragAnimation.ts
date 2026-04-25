import { useState, useCallback, useEffect, useRef } from 'react';
import {
  type DragAnimationConfig,
  DEFAULT_DRAG_ANIMATION_CONFIG,
  type AnimationPhaseConfig,
  buildTransformString,
  buildTransitionString,
  mergeDragAnimationConfig,
} from '../animations/dragAnimationConfig';

interface WindowWithTelemetry extends Window {
  __TELEMETRY_ENABLED__?: boolean;
}

function emitTelemetryEvent(eventName: string, payload: Record<string, unknown>): void {
  if (typeof window !== 'undefined' && (window as WindowWithTelemetry).__TELEMETRY_ENABLED__) {
    console.log(`[Telemetry] ${eventName}`, payload);
  }
}

export type DragAnimationPhase = 'idle' | 'pickup' | 'dragging' | 'hover' | 'drop' | 'cancel' | 'invalid';

export interface DragAnimationState {
  phase: DragAnimationPhase;
  isAnimating: boolean;
  transform: string;
  opacity: number;
  transition: string;
  willChange: string;
}

export interface DragAnimationControls {
  state: DragAnimationState;
  onPickup: () => void;
  onDragStart: () => void;
  onHoverValid: () => void;
  onHoverInvalid: () => void;
  onDrop: () => void;
  onCancel: () => void;
  reset: () => void;
  applyStyles: (element: HTMLElement | null) => void;
}

export interface UseDragAnimationOptions {
  config?: Partial<DragAnimationConfig>;
  onAnimationComplete?: (phase: DragAnimationPhase) => void;
  elementId?: string;
}

const IDLE_STATE: DragAnimationState = {
  phase: 'idle',
  isAnimating: false,
  transform: 'none',
  opacity: 1,
  transition: 'none',
  willChange: 'auto',
};

export function useDragAnimation(options: UseDragAnimationOptions = {}): DragAnimationControls {
  const { config: configOverride, onAnimationComplete, elementId } = options;
  
  const config = configOverride
    ? mergeDragAnimationConfig(DEFAULT_DRAG_ANIMATION_CONFIG, configOverride)
    : DEFAULT_DRAG_ANIMATION_CONFIG;
  
  const [state, setState] = useState<DragAnimationState>(IDLE_STATE);
  const animationTimeoutRef = useRef<number | null>(null);
  const performanceStartRef = useRef<number>(0);
  const prefersReducedMotion = useRef<boolean>(false);
  
  useEffect(() => {
    if (config.performance.reducedMotion) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion.current = mediaQuery.matches;
      
      const handleChange = (e: MediaQueryListEvent) => {
        prefersReducedMotion.current = e.matches;
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [config.performance.reducedMotion]);
  
  const clearAnimationTimeout = useCallback(() => {
    if (animationTimeoutRef.current !== null) {
      window.clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);
  
  const emitTelemetry = useCallback((phase: DragAnimationPhase, duration: number) => {
    if (!config.telemetry.enabled) return;
    
    const payload: Record<string, unknown> = {
      phase,
      elementId: elementId || 'unknown',
    };
    
    if (config.telemetry.includeDuration) {
      payload.duration = duration;
    }
    
    if (config.telemetry.includePerformance && performanceStartRef.current > 0) {
      payload.performanceDuration = performance.now() - performanceStartRef.current;
    }
    
    emitTelemetryEvent(config.telemetry.eventName, payload);
  }, [config.telemetry, elementId]);
  
  const applyPhase = useCallback((phase: DragAnimationPhase, phaseConfig: AnimationPhaseConfig) => {
    if (!config.enabled || prefersReducedMotion.current) {
      setState(IDLE_STATE);
      return;
    }
    
    clearAnimationTimeout();
    performanceStartRef.current = performance.now();
    
    const transform = buildTransformString(phaseConfig.transform);
    const transition = buildTransitionString(phaseConfig);
    const willChange = config.performance.willChange.join(', ');
    
    const newState: DragAnimationState = {
      phase,
      isAnimating: true,
      transform,
      opacity: phaseConfig.transform.opacity,
      transition,
      willChange,
    };
    
    if (phaseConfig.delay > 0) {
      animationTimeoutRef.current = window.setTimeout(() => {
        setState(newState);
        
        animationTimeoutRef.current = window.setTimeout(() => {
          setState(prev => ({ ...prev, isAnimating: false }));
          emitTelemetry(phase, phaseConfig.duration);
          onAnimationComplete?.(phase);
        }, phaseConfig.duration);
      }, phaseConfig.delay);
    } else {
      setState(newState);
      
      animationTimeoutRef.current = window.setTimeout(() => {
        setState(prev => ({ ...prev, isAnimating: false }));
        emitTelemetry(phase, phaseConfig.duration);
        onAnimationComplete?.(phase);
      }, phaseConfig.duration);
    }
  }, [config, clearAnimationTimeout, emitTelemetry, onAnimationComplete]);
  
  const onPickup = useCallback(() => {
    applyPhase('pickup', config.pickup);
  }, [applyPhase, config.pickup]);
  
  const onDragStart = useCallback(() => {
    applyPhase('dragging', config.dragging);
  }, [applyPhase, config.dragging]);
  
  const onHoverValid = useCallback(() => {
    applyPhase('hover', config.hover);
  }, [applyPhase, config.hover]);
  
  const onHoverInvalid = useCallback(() => {
    applyPhase('invalid', config.invalid);
  }, [applyPhase, config.invalid]);
  
  const onDrop = useCallback(() => {
    applyPhase('drop', config.drop);
  }, [applyPhase, config.drop]);
  
  const onCancel = useCallback(() => {
    applyPhase('cancel', config.cancel);
  }, [applyPhase, config.cancel]);
  
  const reset = useCallback(() => {
    clearAnimationTimeout();
    setState(IDLE_STATE);
  }, [clearAnimationTimeout]);
  
  const applyStyles = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    element.style.transform = state.transform;
    element.style.opacity = state.opacity.toString();
    element.style.transition = state.transition;
    element.style.willChange = state.willChange;
    
    if (config.performance.useGPUAcceleration) {
      element.style.backfaceVisibility = 'hidden';
      element.style.perspective = '1000px';
    }
  }, [state, config.performance.useGPUAcceleration]);
  
  useEffect(() => {
    return () => {
      clearAnimationTimeout();
    };
  }, [clearAnimationTimeout]);
  
  return {
    state,
    onPickup,
    onDragStart,
    onHoverValid,
    onHoverInvalid,
    onDrop,
    onCancel,
    reset,
    applyStyles,
  };
}

export function useDragAnimationRef(options: UseDragAnimationOptions = {}) {
  const controls = useDragAnimation(options);
  const elementRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    controls.applyStyles(elementRef.current);
  }, [controls]);
  
  return {
    ...controls,
    ref: elementRef,
  };
}
