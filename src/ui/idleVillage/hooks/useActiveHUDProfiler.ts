/**
 * Active HUD Performance Profiler Hook
 * 
 * React hook for monitoring Active HUD performance metrics including FPS,
 * render time, React commit time, and user interaction latency.
 * 
 * @since NP-104 – Idle Village Active HUD Performance Profiler
 * @dependencies Phase 12 Active HUD
 */

import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  ActiveHUDProfilerConfig,
  PerformanceMetricType,
  PerformanceThreshold,
  PerformanceMetricConfig
} from '../config/activeHUDProfilerConfig';
import { 
  DEFAULT_ACTIVE_HUD_PROFILER_CONFIG,
  getPerformanceThreshold,
  getPerformanceColor
} from '../config/activeHUDProfilerConfig';

/**
 * Performance data point for a specific metric
 */
export interface PerformanceDataPoint {
  /** Timestamp when the measurement was taken */
  timestamp: number;
  /** Metric value */
  value: number;
  /** Performance threshold classification */
  threshold: PerformanceThreshold;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
  /** Average value */
  average: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Median value */
  median: number;
  /** 95th percentile */
  p95: number;
  /** Standard deviation */
  stdDev: number;
  /** Sample count */
  sampleCount: number;
  /** Current threshold */
  currentThreshold: PerformanceThreshold;
}

/**
 * Profiler session information
 */
export interface ProfilerSession {
  /** Unique session identifier */
  id: string;
  /** Session start timestamp */
  startTime: number;
  /** Session end timestamp (null if ongoing) */
  endTime: number | null;
  /** Session duration in milliseconds */
  duration: number;
  /** Number of data points collected */
  dataPoints: number;
  /** Session metadata */
  metadata: {
    userAgent: string;
    viewport: { width: number; height: number };
    deviceMemory: number;
    hardwareConcurrency: number;
  };
}

/**
 * Hook configuration options
 */
export interface UseActiveHUDProfilerOptions {
  /** Custom profiler configuration */
  config?: Partial<ActiveHUDProfilerConfig>;
  /** Auto-start profiling on mount */
  autoStart?: boolean;
  /** Maximum session duration in milliseconds */
  maxDuration?: number;
  /** Enable telemetry emission */
  enableTelemetry?: boolean;
  /** Debug mode for development */
  debug?: boolean;
}

/**
 * Hook return value
 */
export interface UseActiveHUDProfilerReturn {
  /** Whether profiling is currently active */
  isProfiling: boolean;
  /** Current profiler session */
  currentSession: ProfilerSession | null;
  /** Performance data for each metric */
  performanceData: Record<PerformanceMetricType, PerformanceDataPoint[]>;
  /** Aggregated statistics for each metric */
  performanceStats: Record<PerformanceMetricType, PerformanceStats | null>;
  /** Start a new profiling session */
  startProfiling: () => void;
  /** Stop the current profiling session */
  stopProfiling: () => void;
  /** Clear all collected data */
  clearData: () => void;
  /** Export performance data */
  exportData: (format: 'json' | 'csv' | 'markdown') => string;
  /** Toggle profiler panel visibility */
  togglePanel: () => void;
  /** Whether the profiler panel is visible */
  panelVisible: boolean;
  /** Current configuration */
  config: ActiveHUDProfilerConfig;
  /** Update configuration */
  updateConfig: (updates: Partial<ActiveHUDProfilerConfig>) => void;
}

/**
 * Main Active HUD profiler hook
 */
export function useActiveHUDProfiler(options: UseActiveHUDProfilerOptions = {}): UseActiveHUDProfilerReturn {
  const {
    config: customConfig,
    autoStart = false,
    maxDuration = 300000, // 5 minutes
    enableTelemetry = true,
    debug = false
  } = options;

  // Merge custom config with defaults
  const [config, setConfig] = useState<ActiveHUDProfilerConfig>(() => ({
    ...DEFAULT_ACTIVE_HUD_PROFILER_CONFIG,
    ...customConfig
  }));

  // Profiling state
  const [isProfiling, setIsProfiling] = useState(false);
  const [currentSession, setCurrentSession] = useState<ProfilerSession | null>(null);
  const [performanceData, setPerformanceData] = useState<Record<PerformanceMetricType, PerformanceDataPoint[]>>(() => 
    Object.fromEntries(
      Object.keys(DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.metrics).map(key => [key, []])
    ) as Record<PerformanceMetricType, PerformanceDataPoint[]>
  );
  const [panelVisible, setPanelVisible] = useState(config.ui.panelVisible);

  // Refs for performance monitoring
  const sessionRef = useRef<ProfilerSession | null>(null);
  const frameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const renderStartRef = useRef<number>(0);
  const interactionStartRef = useRef<number>(0);
  const intervalsRef = useRef<Map<PerformanceMetricType, NodeJS.Timeout>>(new Map());

  /**
   * Calculate aggregated statistics for performance data
   */
  const calculateStats = useCallback((data: PerformanceDataPoint[]): PerformanceStats | null => {
    if (data.length === 0) return null;

    const values = data.map(point => point.value);
    const sorted = [...values].sort((a, b) => a - b);
    
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const latestThreshold = data[data.length - 1]?.threshold || 'acceptable';

    return {
      average,
      min,
      max,
      median,
      p95,
      stdDev,
      sampleCount: data.length,
      currentThreshold: latestThreshold
    };
  }, []);

  /**
   * Get aggregated statistics for all metrics
   */
  const performanceStats = useMemo(() => {
    const stats: Record<PerformanceMetricType, PerformanceStats | null> = {} as any;
    
    for (const metricType of Object.keys(performanceData) as PerformanceMetricType[]) {
      stats[metricType] = calculateStats(performanceData[metricType]);
    }
    
    return stats;
  }, [performanceData, calculateStats]);

  /**
   * Add a performance data point
   */
  const addDataPoint = useCallback((
    metricType: PerformanceMetricType,
    value: number,
    metadata?: Record<string, any>
  ) => {
    if (!isProfiling) return;

    const metricConfig = config.metrics.find(m => m.id === metricType);
    if (!metricConfig || !metricConfig.enabled) return;

    // Apply sampling
    if (Math.random() > metricConfig.samplingRate) return;

    const threshold = getPerformanceThreshold(metricConfig, value);
    const dataPoint: PerformanceDataPoint = {
      timestamp: Date.now(),
      value,
      threshold,
      metadata
    };

    setPerformanceData(prev => {
      const updated = { ...prev };
      const metricData = [...(updated[metricType] || [])];
      
      // Add new data point
      metricData.push(dataPoint);
      
      // Enforce max samples limit
      if (metricData.length > metricConfig.collection.maxSamples) {
        metricData.shift();
      }
      
      updated[metricType] = metricData;
      return updated;
    });

    // Update session data point count
    if (sessionRef.current) {
      sessionRef.current.dataPoints++;
    }

    if (debug) {
      console.log(`[ActiveHUDProfiler] ${metricType}: ${value} (${threshold})`);
    }
  }, [isProfiling, config.metrics, debug]);

  /**
   * Measure FPS using requestAnimationFrame
   */
  const measureFPS = useCallback(() => {
    if (!isProfiling) return;

    const now = performance.now();
    if (lastFrameTimeRef.current > 0) {
      const delta = now - lastFrameTimeRef.current;
      const fps = 1000 / delta;
      addDataPoint('fps', fps);
    }
    lastFrameTimeRef.current = now;
    frameRef.current = requestAnimationFrame(measureFPS);
  }, [isProfiling, addDataPoint]);

  /**
   * Measure React render and commit times
   */
  const measureReactPerformance = useCallback(() => {
    if (!isProfiling) return;

    // Use React DevTools Profiler API if available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot) {
      const originalCommit = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot;
      
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = (...args: any[]) => {
        const start = performance.now();
        originalCommit(...args);
        const commitTime = performance.now() - start;
        addDataPoint('commit_time', commitTime);
      };
    }

    // Measure render time using MutationObserver
    const observer = new MutationObserver(() => {
      if (renderStartRef.current > 0) {
        const renderTime = performance.now() - renderStartRef.current;
        addDataPoint('render_time', renderTime);
        renderStartRef.current = 0;
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    return () => observer.disconnect();
  }, [isProfiling, addDataPoint]);

  /**
   * Measure interaction latency
   */
  const measureInteractionLatency = useCallback(() => {
    if (!isProfiling) return;

    const handleInteractionStart = () => {
      interactionStartRef.current = performance.now();
    };

    const handleInteractionEnd = () => {
      if (interactionStartRef.current > 0) {
        const latency = performance.now() - interactionStartRef.current;
        addDataPoint('interaction_latency', latency);
        interactionStartRef.current = 0;
      }
    };

    // Mouse events
    document.addEventListener('mousedown', handleInteractionStart);
    document.addEventListener('mouseup', handleInteractionEnd);
    
    // Touch events
    document.addEventListener('touchstart', handleInteractionStart);
    document.addEventListener('touchend', handleInteractionEnd);

    return () => {
      document.removeEventListener('mousedown', handleInteractionStart);
      document.removeEventListener('mouseup', handleInteractionEnd);
      document.removeEventListener('touchstart', handleInteractionStart);
      document.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [isProfiling, addDataPoint]);

  /**
   * Measure memory usage (if available)
   */
  const measureMemoryUsage = useCallback(() => {
    if (!isProfiling) return;

    const measure = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        addDataPoint('memory_usage', usedMB);
      }
    };

    const interval = setInterval(measure, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [isProfiling, addDataPoint]);

  /**
   * Start a new profiling session
   */
  const startProfiling = useCallback(() => {
    if (isProfiling) return;

    const sessionId = uuidv4();
    const startTime = Date.now();
    
    const session: ProfilerSession = {
      id: sessionId,
      startTime,
      endTime: null,
      duration: 0,
      dataPoints: 0,
      metadata: {
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        deviceMemory: (navigator as any).deviceMemory || 0,
        hardwareConcurrency: navigator.hardwareConcurrency || 0
      }
    };

    sessionRef.current = session;
    setCurrentSession(session);
    setIsProfiling(true);

    // Start performance monitoring
    frameRef.current = requestAnimationFrame(measureFPS);
    
    const cleanupReact = measureReactPerformance();
    const cleanupInteraction = measureInteractionLatency();
    const cleanupMemory = measureMemoryUsage();

    // Set up interval-based metrics
    config.metrics.forEach(metric => {
      if (metric.enabled && metric.collection.interval > 0) {
        const interval = setInterval(() => {
          // Interval-based metrics are handled by their specific measurement functions
        }, metric.collection.interval);
        
        intervalsRef.current.set(metric.id, interval);
      }
    });

    // Auto-stop after max duration
    const autoStopTimeout = setTimeout(() => {
      stopProfiling();
    }, maxDuration);

    // Store cleanup functions
    (session as any).cleanup = () => {
      cancelAnimationFrame(frameRef.current);
      cleanupReact?.();
      cleanupInteraction?.();
      cleanupMemory?.();
      clearTimeout(autoStopTimeout);
      
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();
    };

    if (debug) {
      console.log(`[ActiveHUDProfiler] Started session: ${sessionId}`);
    }
  }, [isProfiling, maxDuration, config.metrics, measureFPS, measureReactPerformance, measureInteractionLatency, measureMemoryUsage, debug]);

  /**
   * Stop the current profiling session
   */
  const stopProfiling = useCallback(() => {
    if (!isProfiling || !sessionRef.current) return;

    const endTime = Date.now();
    const duration = endTime - sessionRef.current.startTime;
    
    sessionRef.current.endTime = endTime;
    sessionRef.current.duration = duration;
    
    // Call cleanup functions
    if ((sessionRef.current as any).cleanup) {
      (sessionRef.current as any).cleanup();
    }

    setIsProfiling(false);
    setCurrentSession({ ...sessionRef.current });

    // Emit telemetry event
    if (enableTelemetry && config.telemetry.enabled) {
      emitTelemetryEvent(sessionRef.current);
    }

    if (debug) {
      console.log(`[ActiveHUDProfiler] Stopped session: ${sessionRef.current.id} (${duration}ms)`);
    }

    sessionRef.current = null;
  }, [isProfiling, enableTelemetry, config.telemetry, debug]);

  /**
   * Emit telemetry event for profiling session
   */
  const emitTelemetryEvent = useCallback((session: ProfilerSession) => {
    if (Math.random() > config.telemetry.samplingRate) return;

    const telemetryData = {
      sessionId: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      dataPoints: session.dataPoints,
      metrics: Object.entries(performanceStats).map(([metric, stats]) => ({
        metric,
        stats: stats ? {
          average: stats.average,
          min: stats.min,
          max: stats.max,
          p95: stats.p95,
          sampleCount: stats.sampleCount,
          currentThreshold: stats.currentThreshold
        } : null
      })),
      metadata: session.metadata
    };

    // Emit telemetry event (implementation depends on your telemetry system)
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(config.telemetry.eventName, {
        detail: telemetryData
      }));
    }

    if (debug) {
      console.log(`[ActiveHUDProfiler] Telemetry emitted: ${config.telemetry.eventName}`, telemetryData);
    }
  }, [config.telemetry, performanceStats, debug]);

  /**
   * Clear all collected performance data
   */
  const clearData = useCallback(() => {
    setPerformanceData(
      Object.fromEntries(
        Object.keys(DEFAULT_ACTIVE_HUD_PROFILER_CONFIG.metrics).map(key => [key, []])
      ) as Record<PerformanceMetricType, PerformanceDataPoint[]>
    );
    setCurrentSession(null);
    sessionRef.current = null;
  }, []);

  /**
   * Export performance data in specified format
   */
  const exportData = useCallback((format: 'json' | 'csv' | 'markdown'): string => {
    const exportConfig = config.exports.find(e => e.id === format);
    if (!exportConfig || !exportConfig.available) {
      throw new Error(`Export format '${format}' is not available`);
    }

    const session = currentSession || sessionRef.current;
    const exportData = {
      session,
      config: exportConfig.options.includeMetadata ? config : undefined,
      metrics: Object.entries(performanceData).map(([metric, data]) => ({
        metric,
        data: exportConfig.options.includeRawData ? data : undefined,
        stats: exportConfig.options.includeAggregates ? performanceStats[metric] : undefined
      })),
      timestamp: Date.now()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      
      case 'csv':
        return convertToCSV(exportData);
      
      case 'markdown':
        return convertToMarkdown(exportData);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }, [config, currentSession, performanceData, performanceStats]);

  /**
   * Convert data to CSV format
   */
  const convertToCSV = (data: any): string => {
    const headers = ['timestamp', 'metric', 'value', 'threshold'];
    const rows = [headers.join(',')];

    Object.entries(data.metrics).forEach(([metric, metricData]: [string, any]) => {
      if (metricData.data) {
        metricData.data.forEach((point: PerformanceDataPoint) => {
          rows.push([
            point.timestamp,
            metric,
            point.value,
            point.threshold
          ].join(','));
        }
        );
      }
    });

    return rows.join('\n');
  };

  /**
   * Convert data to Markdown format
   */
  const convertToMarkdown = (data: any): string => {
    let markdown = '# Active HUD Performance Report\n\n';
    
    if (data.session) {
      markdown += `## Session: ${data.session.id}\n`;
      markdown += `- **Duration**: ${data.session.duration}ms\n`;
      markdown += `- **Data Points**: ${data.session.dataPoints}\n`;
      markdown += `- **Start**: ${new Date(data.session.startTime).toISOString()}\n`;
      markdown += `- **End**: ${data.session.endTime ? new Date(data.session.endTime).toISOString() : 'Ongoing'}\n\n`;
    }

    markdown += '## Performance Metrics\n\n';
    
    Object.entries(data.metrics).forEach(([metric, metricData]: [string, any]) => {
      markdown += `### ${metric}\n`;
      
      if (metricData.stats) {
        const stats = metricData.stats;
        markdown += `- **Average**: ${stats.average.toFixed(2)}\n`;
        markdown += `- **Min**: ${stats.min}\n`;
        markdown += `- **Max**: ${stats.max}\n`;
        markdown += `- **95th Percentile**: ${stats.p95.toFixed(2)}\n`;
        markdown += `- **Current Threshold**: ${stats.currentThreshold}\n`;
      }
      
      markdown += '\n';
    });

    return markdown;
  };

  /**
   * Toggle profiler panel visibility
   */
  const togglePanel = useCallback(() => {
    setPanelVisible(prev => !prev);
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((updates: Partial<ActiveHUDProfilerConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart && config.profiler.autoStart) {
      startProfiling();
    }
  }, [autoStart, config.profiler.autoStart, startProfiling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isProfiling) {
        stopProfiling();
      }
    };
  }, [isProfiling, stopProfiling]);

  return {
    isProfiling,
    currentSession,
    performanceData,
    performanceStats,
    startProfiling,
    stopProfiling,
    clearData,
    exportData,
    togglePanel,
    panelVisible,
    config,
    updateConfig
  };
}

export default useActiveHUDProfiler;
