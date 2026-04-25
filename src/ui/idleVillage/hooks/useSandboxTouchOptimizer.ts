/**
 * Idle Village Touch Optimizer Hook
 * 
 * Optimizes touch interactions for Interaction Mode by adjusting timing,
 * targets, and feedback based on device capabilities and user preferences.
 * 
 * @since NP-064 – Idle Village Interaction Touch Optimizer
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSandboxInteractionMode } from './useSandboxInteractionMode';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';

/**
 * Touch optimization configuration schema
 */
export const TouchOptimizerConfigSchema = z.object({
  /** Long press threshold in milliseconds */
  longPressThreshold: z.number().min(100).max(1000).default(250),
  /** Momentum decay factor for drag operations */
  momentumDecay: z.number().min(0.1).max(1.0).default(0.85),
  /** Haptic feedback intensity (0-1) */
  hapticIntensity: z.number().min(0).max(1).default(0.5),
  /** Touch target size multiplier */
  targetSizeMultiplier: z.number().min(1.0).max(2.0).default(1.2),
  /** Hover delay for touch devices in milliseconds */
  hoverDelay: z.number().min(0).max(500).default(150),
  /** Double tap threshold in milliseconds */
  doubleTapThreshold: z.number().min(100).max(500).default(300),
  /** Swipe velocity threshold */
  swipeVelocityThreshold: z.number().min(0.1).max(2.0).default(0.5),
  /** Pinch zoom sensitivity */
  pinchZoomSensitivity: z.number().min(0.5).max(2.0).default(1.0),
  /** Enable haptic feedback */
  enableHaptics: z.boolean().default(true),
  /** Enable momentum scrolling */
  enableMomentum: z.boolean().default(true),
  /** Enable touch acceleration */
  enableTouchAcceleration: z.boolean().default(true),
});

/**
 * Touch optimization configuration type
 */
export type TouchOptimizerConfig = z.infer<typeof TouchOptimizerConfigSchema>;

/**
 * Default touch optimization configuration
 */
export const DEFAULT_TOUCH_OPTIMIZER_CONFIG: TouchOptimizerConfig = {
  longPressThreshold: 250,
  momentumDecay: 0.85,
  hapticIntensity: 0.5,
  targetSizeMultiplier: 1.2,
  hoverDelay: 150,
  doubleTapThreshold: 300,
  swipeVelocityThreshold: 0.5,
  pinchZoomSensitivity: 1.0,
  enableHaptics: true,
  enableMomentum: true,
  enableTouchAcceleration: true,
};

/**
 * Touch optimization metrics
 */
export interface TouchOptimizationMetrics {
  /** Average long press duration */
  averageLongPressDuration: number;
  /** Average drag velocity */
  averageDragVelocity: number;
  /** Touch accuracy rate */
  touchAccuracy: number;
  /** Haptic feedback count */
  hapticFeedbackCount: number;
  /** Momentum usage rate */
  momentumUsageRate: number;
  /** Error rate per session */
  errorRate: number;
}

/**
 * Touch optimization state
 */
export interface TouchOptimizationState {
  /** Current configuration */
  config: TouchOptimizerConfig;
  /** Optimization metrics */
  metrics: TouchOptimizationMetrics;
  /** Is optimization active */
  isActive: boolean;
  /** Device capabilities */
  deviceCapabilities: {
    supportsHaptics: boolean;
    supportsMomentum: boolean;
    maxTouchPoints: number;
    touchType: 'capacitive' | 'resistive' | 'unknown';
  };
}

/**
 * Touch event data for telemetry
 */
export interface TouchEventData {
  eventType: 'long_press' | 'drag_start' | 'drag_end' | 'tap' | 'swipe' | 'pinch';
  timestamp: number;
  duration?: number;
  velocity?: number;
  accuracy?: number;
  targetSize?: number;
  hapticTriggered?: boolean;
}

/**
 * Hook return type
 */
export interface UseSandboxTouchOptimizerReturn {
  /** Current optimization state */
  state: TouchOptimizationState;
  /** Update configuration */
  updateConfig: (config: Partial<TouchOptimizerConfig>) => Promise<void>;
  /** Reset to defaults */
  resetToDefaults: () => Promise<void>;
  /** Trigger haptic feedback */
  triggerHaptic: (type: 'light' | 'medium' | 'heavy') => void;
  /** Get optimized touch target size */
  getOptimizedTargetSize: (baseSize: number) => number;
  /** Record touch event */
  recordTouchEvent: (event: TouchEventData) => void;
  /** Apply CSS variables for touch optimization */
  applyTouchOptimizations: () => void;
  /** Remove touch optimizations */
  removeTouchOptimizations: () => void;
}

/**
 * Storage key for touch optimizer preferences
 */
const TOUCH_OPTIMIZER_STORAGE_KEY = 'idle_village_touch_optimizer_prefs';

/**
 * Hook for optimizing touch interactions in the sandbox
 */
export function useSandboxTouchOptimizer(): UseSandboxTouchOptimizerReturn {
  const isMobile = useIsMobile();
  const { interactionMode } = useSandboxInteractionMode();
  
  const [state, setState] = useState<TouchOptimizationState>(() => ({
    config: DEFAULT_TOUCH_OPTIMIZER_CONFIG,
    metrics: {
      averageLongPressDuration: 0,
      averageDragVelocity: 0,
      touchAccuracy: 0,
      hapticFeedbackCount: 0,
      momentumUsageRate: 0,
      errorRate: 0,
    },
    isActive: false,
    deviceCapabilities: {
      supportsHaptics: false,
      supportsMomentum: false,
      maxTouchPoints: 1,
      touchType: 'unknown',
    },
  }));

  const touchEventsRef = useRef<TouchEventData[]>([]);
  const configRef = useRef<TouchOptimizerConfig>(state.config);

  /**
   * Async device capabilities detection
   */
  const detectDeviceCapabilitiesAsync = useCallback(async () => {
    if (typeof window === 'undefined') {
      return {
        supportsHaptics: false,
        supportsMomentum: false,
        maxTouchPoints: 1,
        touchType: 'unknown' as const,
      };
    }

    return {
      supportsHaptics: 'vibrate' in navigator,
      supportsMomentum: 'ondevicemotion' in window || 'DeviceMotionEvent' in window,
      maxTouchPoints: navigator.maxTouchPoints || 1,
      touchType: 'capacitive' as const,
    };
  }, []);

  /**
   * Async configuration loading
   */
  const loadConfigurationAsync = useCallback(async () => {
    try {
      const savedConfig = await loadData<TouchOptimizerConfig>(TOUCH_OPTIMIZER_STORAGE_KEY);
      if (savedConfig) {
        return TouchOptimizerConfigSchema.parse(savedConfig);
      }
    } catch (error) {
      console.warn('Failed to load touch optimizer configuration:', error);
    }
    return DEFAULT_TOUCH_OPTIMIZER_CONFIG;
  }, []);

  /**
   * Initialize and manage optimization state
   */
  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      const capabilities = await detectDeviceCapabilitiesAsync();
      const config = await loadConfigurationAsync();
      
      if (mounted) {
        setState(prev => ({
          ...prev,
          deviceCapabilities: capabilities,
          config,
        }));
        configRef.current = config;
      }
    };
    
    initialize();
    
    return () => {
      mounted = false;
    };
  }, [detectDeviceCapabilitiesAsync, loadConfigurationAsync]);

  /**
   * Apply CSS optimizations
   */
  const applyTouchOptimizations = useCallback(() => {
    if (typeof document === 'undefined' || !state.isActive) {
      return;
    }

    const root = document.documentElement;
    const config = state.config;

    // Apply CSS custom properties
    root.style.setProperty('--touch-long-press-threshold', `${config.longPressThreshold}ms`);
    root.style.setProperty('--touch-hover-delay', `${config.hoverDelay}ms`);
    root.style.setProperty('--touch-double-tap-threshold', `${config.doubleTapThreshold}ms`);
    root.style.setProperty('--touch-target-multiplier', config.targetSizeMultiplier.toString());
    root.style.setProperty('--touch-momentum-decay', config.momentumDecay.toString());
    root.style.setProperty('--touch-swipe-threshold', config.swipeVelocityThreshold.toString());
    root.style.setProperty('--touch-pinch-sensitivity', config.pinchZoomSensitivity.toString());

    // Apply touch optimization classes
    root.classList.add('touch-optimized');
    
    if (config.enableMomentum) {
      root.classList.add('momentum-enabled');
    }
    
    if (config.enableTouchAcceleration) {
      root.classList.add('touch-acceleration-enabled');
    }

    recordTouchOptimizationEvent('optimizations_applied', {
      config,
      interactionMode,
      isMobile,
    });
  }, [state.isActive, state.config, interactionMode, isMobile]);

  /**
   * Remove CSS optimizations
   */
  const removeTouchOptimizations = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    
    // Remove CSS custom properties
    root.style.removeProperty('--touch-long-press-threshold');
    root.style.removeProperty('--touch-hover-delay');
    root.style.removeProperty('--touch-double-tap-threshold');
    root.style.removeProperty('--touch-target-multiplier');
    root.style.removeProperty('--touch-momentum-decay');
    root.style.removeProperty('--touch-swipe-threshold');
    root.style.removeProperty('--touch-pinch-sensitivity');

    // Remove touch optimization classes
    root.classList.remove('touch-optimized', 'momentum-enabled', 'touch-acceleration-enabled');

    recordTouchOptimizationEvent('optimizations_removed', {
      interactionMode,
      isMobile,
    });
  }, [interactionMode, isMobile]);

  /**
   * Update active state separately
   */
  useEffect(() => {
    const shouldBeActive = isMobile && interactionMode === 'mobile';
    
    if (state.isActive !== shouldBeActive) {
      // Use requestAnimationFrame to avoid React hooks warning
      requestAnimationFrame(() => {
        setState(prev => ({
          ...prev,
          isActive: shouldBeActive,
        }));
      });
    }
  }, [isMobile, interactionMode, state.isActive]);

  useEffect(() => {
    const shouldBeActive = isMobile && interactionMode === 'mobile';
    
    if (shouldBeActive) {
      applyTouchOptimizations();
    } else {
      removeTouchOptimizations();
    }
  }, [isMobile, interactionMode, state.isActive, applyTouchOptimizations, removeTouchOptimizations]);

  /**
   * Save configuration
   */
  const saveConfiguration = useCallback(async (config: TouchOptimizerConfig) => {
    try {
      await saveData(TOUCH_OPTIMIZER_STORAGE_KEY, config);
    } catch (error) {
      console.warn('Failed to save touch optimizer configuration:', error);
    }
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback(async (newConfig: Partial<TouchOptimizerConfig>) => {
    const updatedConfig = { ...configRef.current, ...newConfig };
    const validatedConfig = TouchOptimizerConfigSchema.parse(updatedConfig);
    
    setState(prev => ({
      ...prev,
      config: validatedConfig,
    }));
    
    configRef.current = validatedConfig;
    await saveConfiguration(validatedConfig);
  }, [saveConfiguration]);

  /**
   * Reset to defaults
   */
  const resetToDefaults = useCallback(async () => {
    setState(prev => ({
      ...prev,
      config: DEFAULT_TOUCH_OPTIMIZER_CONFIG,
    }));
    
    configRef.current = DEFAULT_TOUCH_OPTIMIZER_CONFIG;
    await saveConfiguration(DEFAULT_TOUCH_OPTIMIZER_CONFIG);
  }, [saveConfiguration]);

  /**
   * Trigger haptic feedback
   */
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if (!state.config.enableHaptics || !state.deviceCapabilities.supportsHaptics) {
      return;
    }

    const intensity = state.config.hapticIntensity;
    let duration: number;

    switch (type) {
      case 'light':
        duration = 10 * intensity;
        break;
      case 'medium':
        duration = 25 * intensity;
        break;
      case 'heavy':
        duration = 50 * intensity;
        break;
    }

    navigator.vibrate(duration);
    
    setState(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        hapticFeedbackCount: prev.metrics.hapticFeedbackCount + 1,
      },
    }));
  }, [state.config.enableHaptics, state.config.hapticIntensity, state.deviceCapabilities.supportsHaptics]);

  /**
   * Get optimized touch target size
   */
  const getOptimizedTargetSize = useCallback((baseSize: number) => {
    if (!state.isActive || interactionMode !== 'mobile') {
      return baseSize;
    }

    return Math.round(baseSize * state.config.targetSizeMultiplier);
  }, [state.isActive, state.config.targetSizeMultiplier, interactionMode]);

  /**
   * Record touch event for metrics
   */
  const recordTouchEvent = useCallback((event: TouchEventData) => {
    touchEventsRef.current.push(event);
    
    // Update metrics based on event
    setState(prev => {
      const updatedMetrics = { ...prev.metrics };
      
      switch (event.eventType) {
        case 'long_press':
          if (event.duration) {
            updatedMetrics.averageLongPressDuration = 
              (updatedMetrics.averageLongPressDuration + event.duration) / 2;
          }
          break;
        case 'drag_start':
        case 'drag_end':
          if (event.velocity) {
            updatedMetrics.averageDragVelocity = 
              (updatedMetrics.averageDragVelocity + event.velocity) / 2;
          }
          break;
      }
      
      return {
        ...prev,
        metrics: updatedMetrics,
      };
    });
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      removeTouchOptimizations();
    };
  }, [removeTouchOptimizations]);

  return {
    state,
    updateConfig,
    resetToDefaults,
    triggerHaptic,
    getOptimizedTargetSize,
    recordTouchEvent,
    applyTouchOptimizations,
    removeTouchOptimizations,
  };
}
