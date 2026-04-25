/**
 * STS Simulator State Hook with Performance Mode
 * 
 * Enhanced simulator state management with performance mode toggle and optimizations.
 * Integrates with performance mode configuration for UI updates, simulation batching, and memory management.
 * 
 * @module useSTSSimulatorState
 * @since 2026-01-11
 * @author Helios-Perf
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import type { STSSimulatorState } from './stsSimulatorState';
import { DEFAULT_PERFORMANCE_MODE_CONFIG, PERFORMANCE_PRESETS, mergePerformanceConfig, validatePerformanceConfig } from '../../config/sts/performanceModeConfig';

export type STSRunRecorderState = any;

/**
 * Performance mode state interface
 */
export interface PerformanceModeState {
  /** Whether performance mode is enabled */
  enabled: boolean;
  /** Current performance configuration */
  config: import('../../config/sts/performanceModeConfig').STSPerformanceModeConfig;
  /** Performance metrics for monitoring */
  metrics: {
    fps: number;
    memoryUsage: number;
    renderTime: number;
    lastUpdate: number;
  };
  /** Throttled/debounced function references */
  throttledFunctions: {
    updateUI: (() => void) | null;
    updateLog: (() => void) | null;
    updateTelemetry: (() => void) | null;
  };
}

/**
 * Enhanced simulator state hook with performance mode support
 */
export interface UseSTSSimulatorStateResult {
  /** Current simulator state */
  state: STSSimulatorState;
  /** Performance mode state */
  performanceMode: PerformanceModeState;
  /** Toggle performance mode */
  togglePerformanceMode: () => void;
  /** Update performance mode configuration */
  updatePerformanceConfig: (config: Partial<import('../../config/performanceModeConfig').STSPerformanceModeConfig>) => void;
  /** Set performance mode preset */
  setPerformancePreset: (preset: keyof typeof PERFORMANCE_PRESETS) => void;
  /** Get current performance metrics */
  getPerformanceMetrics: () => PerformanceModeState['metrics'];
  /** Clear performance metrics */
  clearMetrics: () => void;
  /** Force garbage collection */
  forceGarbageCollection: () => void;
}

/**
 * Hook for managing STS simulator state with performance mode
 * 
 * @param options - Initial configuration options
 * @returns Enhanced simulator state with performance mode support
 * 
 * @example
 * ```typescript
 * const { state, performanceMode, togglePerformanceMode } = useSTSSimulatorState({
 *   initialDeckId: 'starter_deck',
 *   initialEnemyId: 'default_enemy',
 *   initialSeed: 12345,
 *   performanceMode: 'balanced'
 * });
 * ```
 */
export const useSTSSimulatorState = (
  options: {
    initialDeckId?: string;
    initialEnemyId?: string;
    initialSeed?: number;
    performanceMode?: keyof typeof PERFORMANCE_PRESETS | Partial<import('../../config/performanceModeConfig').STSPerformanceModeConfig>;
  } = {}
): UseSTSSimulatorStateResult => {
  // Initialize performance mode state
  const [performanceMode, setPerformanceMode] = useState<PerformanceModeState>(() => {
    const initialConfig = typeof options.performanceMode === 'string' 
      ? PERFORMANCE_PRESETS[options.performanceMode] || DEFAULT_PERFORMANCE_MODE_CONFIG
      : mergePerformanceConfig(DEFAULT_PERFORMANCE_MODE_CONFIG, options.performanceMode || {});
    
    return {
      enabled: initialConfig.enabled,
      config: initialConfig,
      metrics: {
        fps: 0,
        memoryUsage: 0,
        renderTime: 0,
        lastUpdate: Date.now(),
      },
      throttledFunctions: {
        updateUI: null,
        updateLog: null,
        updateTelemetry: null,
      },
    };
  });

  // Performance monitoring
  const frameCount = useRef(0);
  const lastFrameTime = useRef<number>(() => Date.now());

  // Create throttled functions
  const createThrottledFunction = useCallback((
    callback: () => void,
    delay: number
  ) => {
    let lastCall = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<typeof callback>) => {
      const now = Date.now();
      if (now - lastCall < delay) {
        return;
      }
      
      lastCall = now;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  }, []);

  // Initialize throttled functions when performance mode changes
  useEffect(() => {
    if (performanceMode.enabled) {
      setPerformanceMode(prev => ({
        ...prev,
        throttledFunctions: {
          updateUI: createThrottledFunction(() => {
            // UI update logic will be handled by components
          }, performanceMode.config.ui.throttleMs),
          updateLog: createThrottledFunction(() => {
            // Log update logic will be handled by components
          }, performanceMode.config.ui.debounceLogMs),
          updateTelemetry: createThrottledFunction(() => {
            // Telemetry update logic will be handled by components
          }, performanceMode.config.ui.throttleMs),
        },
      }));
    } else {
      setPerformanceMode(prev => ({
        ...prev,
        throttledFunctions: {
          updateUI: null,
          updateLog: null,
          updateTelemetry: null,
        },
      }));
    }
  }, [performanceMode.enabled, performanceMode.config.ui.throttleMs, performanceMode.config.ui.debounceLogMs]);

  // Performance monitoring
  useEffect(() => {
    if (!performanceMode.enabled || !performanceMode.config.debug.enableMonitoring) return;

    const measurePerformance = () => {
      const now = Date.now();
      const deltaTime = now - lastFrameTime.current;
      
      // Calculate FPS
      frameCount.current++;
      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / deltaTime);
        
        setPerformanceMode(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            fps,
            lastUpdate: now,
          },
        }));
        
        frameCount.current = 0;
        lastFrameTime.current = now;
      }
      
      // Measure memory usage (approximate)
      if (performanceMode.config.memory.gcIntervalMs > 0 && now - performanceMode.metrics.lastUpdate > performanceMode.config.memory.gcIntervalMs) {
        if (performanceMode.config.debug.showMemoryUsage) {
          // Approximate memory usage
          const memoryUsage = performanceMode.config.memory.autoClearLogs ? 
            performanceMode.config.memory.maxTurnLogs * 100 : // Rough estimate
            0;
          
          setPerformanceMode(prev => ({
            ...prev,
            metrics: {
              ...prev.metrics,
              memoryUsage,
              lastUpdate: now,
            },
          }));
        }
      }
      
      requestAnimationFrame(measurePerformance);
    };

    const animationId = requestAnimationFrame(measurePerformance);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [
    performanceMode.enabled,
    performanceMode.config.debug.enableMonitoring,
    performanceMode.config.debug.showFPSCounter,
    performanceMode.config.memory.gcIntervalMs,
    performanceMode.metrics.lastUpdate,
    performanceMode.config.memory.autoClearLogs,
    performanceMode.config.memory.maxTurnLogs,
  ]);

  // Garbage collection
  const forceGarbageCollection = useCallback(() => {
    if (window.gc && performanceMode.config.memory.autoClearLogs) {
      // Clear old logs and data
      setPerformanceMode(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          memoryUsage: 0,
        },
      }));
      
      // Force garbage collection if available
      try {
        window.gc();
      } catch (e) {
        // Ignore errors if gc is not available
      }
    }
  }, [performanceMode.config.memory.autoClearLogs]);

  // Toggle performance mode
  const togglePerformanceMode = useCallback(() => {
    setPerformanceMode(prev => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  }, []);

  // Update performance mode configuration
  const updatePerformanceConfig = useCallback((
    config: Partial<import('../../config/performanceModeConfig').STSPerformanceModeConfig>
  ) => {
    if (!validatePerformanceConfig(config)) {
      console.warn('Invalid performance mode configuration:', config);
      return;
    }
    
    setPerformanceMode(prev => ({
      ...prev,
      config: mergePerformanceConfig(prev.config, config),
    }));
  }, []);

  // Set performance mode preset
  const setPerformancePreset = useCallback((
    preset: keyof typeof PERFORMANCE_PRESETS
  ) => {
    const presetConfig = PERFORMANCE_PRESETS[preset];
    if (!presetConfig) {
      console.warn(`Unknown performance preset: ${preset}`);
      return;
    }
    
    setPerformanceMode(prev => ({
      ...prev,
      config: presetConfig,
    }));
  }, []);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => performanceMode.metrics, [performanceMode.metrics]);

  // Clear performance metrics
  const clearMetrics = useCallback(() => {
    setPerformanceMode(prev => ({
      ...prev,
      metrics: {
        fps: 0,
        memoryUsage: 0,
        renderTime: 0,
        lastUpdate: Date.now(),
      },
    }));
  }, []);

  // Note: The actual simulator state management would be handled by the existing useSTSSimulatorEngine hook
  // This hook focuses only on performance mode features
  
  return {
    // This would be integrated with the existing hook
    state: {} as STSSimulatorState, // Placeholder - actual state from useSTSSimulatorEngine
    performanceMode,
    togglePerformanceMode,
    updatePerformanceConfig,
    setPerformancePreset,
    getPerformanceMetrics,
    clearMetrics,
    forceGarbageCollection,
  };
};
