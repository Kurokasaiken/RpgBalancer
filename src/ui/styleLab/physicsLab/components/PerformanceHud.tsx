/**
 * Performance HUD Component
 *
 * Real-time performance monitoring overlay for Physics Lab.
 * Displays FPS, CPU usage, and concurrency metrics with toggleable visibility.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type PerformanceBudgetMonitor, type PerformanceBudgetState, createPerformanceBudgetMonitor } from '../utils/perfBudget';
import { DEFAULT_HUD_CONFIG, type PerformanceHudConfig } from './PerformanceHudConstants';

/**
 * Props for PerformanceHud component.
 */
export interface PerformanceHudProps {
  /** Performance budget monitor instance */
  monitor?: PerformanceBudgetMonitor;
  /** Configuration overrides */
  config?: Partial<PerformanceHudConfig>;
  /** External visibility control */
  visible?: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * Performance HUD component.
 *
 * Provides real-time performance metrics display with toggleable visibility.
 * Integrates with PerformanceBudgetMonitor to show FPS, CPU usage, and concurrency.
 */
export const PerformanceHud: React.FC<PerformanceHudProps> = ({
  monitor,
  config = {},
  visible: externalVisible,
  onVisibilityChange,
}) => {
  const finalConfig = { ...DEFAULT_HUD_CONFIG, ...config };
  const [internalVisible, setInternalVisible] = useState(finalConfig.defaultVisible);
  const [state, setState] = useState<PerformanceBudgetState>(() => monitor?.getState() || {
    current: {
      fps: 0,
      cpuMs: 0,
      audioConcurrency: 0,
      hapticConcurrency: 0,
      memory: {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
      },
      timestamp: Date.now(),
    },
    history: [],
    isBlocked: false,
    blockReason: null,
    blockStartedAt: null,
  });

  const monitorRef = useRef<PerformanceBudgetMonitor | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Initialize last frame time on mount
  useEffect(() => {
    lastFrameTimeRef.current = Date.now();
  }, []);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // Initialize monitor if not provided
  useEffect(() => {
    if (!monitor) {
      monitorRef.current = createPerformanceBudgetMonitor();
      return () => {
        if (monitorRef.current) {
          monitorRef.current.reset();
        }
      };
    } else {
      monitorRef.current = monitor;
    }
  }, [monitor]);

  // Subscribe to monitor state changes
  useEffect(() => {
    const currentMonitor = monitorRef.current;
    if (!currentMonitor) return;

    const unsubscribe = currentMonitor.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  // Performance monitoring loop
  useEffect(() => {
    if (!finalConfig.enabled) return;

    const currentMonitor = monitorRef.current;
    if (!currentMonitor) return;

    // FPS monitoring using requestAnimationFrame
    const measureFPS = () => {
      const now = Date.now();
      const delta = now - lastFrameTimeRef.current;
      const fps = Math.round(1000 / delta);
      
      lastFrameTimeRef.current = now;
      
      currentMonitor.updateMetrics({ fps });
      
      animationFrameRef.current = requestAnimationFrame(measureFPS);
    };

    // CPU monitoring using PerformanceObserver
    const setupCPUMonitoring = () => {
      if (typeof PerformanceObserver !== 'undefined') {
        try {
          performanceObserverRef.current = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            let totalDuration = 0;
            
            entries.forEach((entry) => {
              if (entry.duration) {
                totalDuration += entry.duration;
              }
            });
            
            currentMonitor.updateMetrics({ cpuMs: totalDuration });
          });
          
          performanceObserverRef.current.observe({ 
            entryTypes: ['measure', 'navigation', 'resource'] 
          });
        } catch (error) {
          console.warn('[PerformanceHud] PerformanceObserver not available:', error);
        }
      }
    };

    // Start monitoring
    measureFPS();
    setupCPUMonitoring();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, [finalConfig.enabled]);

  // Handle visibility toggle
  const toggleVisibility = useCallback(() => {
    const newVisible = !internalVisible;
    setInternalVisible(newVisible);
    onVisibilityChange?.(newVisible);
  }, [internalVisible, onVisibilityChange]);

  // Determine actual visibility
  const isVisible = externalVisible !== undefined ? externalVisible : internalVisible;

  // Get theme styles
  const getThemeStyles = () => {
    if (finalConfig.theme === 'light') {
      return {
        background: 'rgba(255, 255, 255, 0.95)',
        color: '#1a1a1a',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        shadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      };
    } else {
      return {
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        shadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      };
    }
  };

  // Get position styles
  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 9999,
      padding: '12px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      minWidth: '200px',
      maxWidth: '300px',
      transition: 'opacity 0.2s ease-in-out',
    };

    switch (finalConfig.position) {
      case 'top-left':
        return { ...base, top: '20px', left: '20px' };
      case 'top-right':
        return { ...base, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' };
      case 'bottom-right':
        return { ...base, bottom: '20px', right: '20px' };
      default:
        return { ...base, top: '20px', right: '20px' };
    }
  };

  const themeStyles = getThemeStyles();
  const positionStyles = getPositionStyles();
  const [summary, setSummary] = useState<any>(undefined);

  // Update summary when monitor changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSummary(monitorRef.current?.getSummary());
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [state]);

  if (!finalConfig.enabled || !isVisible) {
    return null;
  }

  const getStatusColor = (status: 'good' | 'poor' | 'warning') => {
    switch (status) {
      case 'good':
        return finalConfig.theme === 'light' ? '#22c55e' : '#86efac';
      case 'poor':
        return finalConfig.theme === 'light' ? '#ef4444' : '#fca5a5';
      case 'warning':
        return finalConfig.theme === 'light' ? '#f59e0b' : '#fcd34d';
      default:
        return finalConfig.theme === 'light' ? '#6b7280' : '#9ca3af';
    }
  };

  return (
    <div
      style={{
        ...positionStyles,
        background: themeStyles.background,
        color: themeStyles.color,
        border: themeStyles.border,
        boxShadow: themeStyles.shadow,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Performance HUD</div>
        <button
          onClick={toggleVisibility}
          style={{
            background: 'none',
            border: 'none',
            color: themeStyles.color,
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(128, 128, 128, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          ×
        </button>
      </div>

      {summary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* FPS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>FPS:</span>
            <span style={{ color: getStatusColor(summary.fps.status) }}>
              {summary.fps.current} / {summary.fps.median} (target: {summary.fps.target})
            </span>
          </div>

          {/* CPU */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>CPU:</span>
            <span style={{ color: getStatusColor(summary.cpu.status) }}>
              {summary.cpu.current.toFixed(2)}ms / {summary.cpu.median.toFixed(2)}ms (max: {summary.cpu.target}ms)
            </span>
          </div>

          {/* Concurrency */}
          <div style={{ fontSize: '11px', opacity: 0.8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Audio:</span>
              <span style={{ color: getStatusColor(summary.concurrency.audio.status) }}>
                {summary.concurrency.audio.current} / {summary.concurrency.audio.max}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Haptic:</span>
              <span style={{ color: getStatusColor(summary.concurrency.haptic.status) }}>
                {summary.concurrency.haptic.current} / {summary.concurrency.haptic.max}
              </span>
            </div>
          </div>

          {/* Block Status */}
          {summary.block.blocked && (
            <div
              style={{
                marginTop: '8px',
                padding: '6px',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '11px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>EXPORT BLOCKED</div>
              <div>{summary.block.reason}</div>
              <div>{summary.block.durationSeconds.toFixed(1)}s / {summary.block.budgetDuration}s</div>
            </div>
          )}

          {/* Memory */}
          <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px' }}>
            <div>Memory: {(state.current.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceHud;
