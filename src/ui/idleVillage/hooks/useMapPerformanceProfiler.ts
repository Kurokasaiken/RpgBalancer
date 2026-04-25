/**
 * Map Performance Profiler Hook - NP-024
 * 
 * React hook for managing the Idle Village Map Performance Profiler.
 * Provides state management, event handling, and integration with the profiler engine.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { MapPerformanceProfilerEngine } from '../utils/mapPerformanceProfilerEngine';
import { MapPerformanceProfilerExporter } from '../utils/mapPerformanceProfilerExporter';
import {
  type MapPerformanceProfilerConfig,
  type PerformanceMetrics,
  type PerformanceStatistics,
  type PerformanceRecommendation,
  PerformanceMetricType,
  PerformanceSeverity,
  DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
} from '../config/mapPerformanceProfilerConfig';

const diagnostics = createSandboxDiagnostics('useMapPerformanceProfiler', 'hook');

/**
 * Hook return type
 */
export interface UseMapPerformanceProfilerReturn {
  // State
  isRunning: boolean;
  metrics: PerformanceMetrics;
  statistics: PerformanceStatistics;
  recommendations: PerformanceRecommendation[];
  frameBuffer: any[];
  isHUDVisible: boolean;
  isCompactMode: boolean;
  
  // Actions
  start: () => void;
  stop: () => void;
  toggleHUD: () => void;
  toggleCompact: () => void;
  clearData: () => void;
  exportData: (format: 'csv' | 'json') => void;
  downloadData: (format: 'csv' | 'json') => void;
  
  // Configuration
  updateConfig: (config: Partial<MapPerformanceProfilerConfig>) => void;
  getConfig: () => MapPerformanceProfilerConfig;
  
  // Analysis
  analyzePerformance: () => any;
  getRecentEntries: (count?: number) => any[];
  
  // Events
  onMetricsUpdated: (callback: (metrics: PerformanceMetrics) => void) => void;
  onThresholdExceeded: (callback: (metric: PerformanceMetricType, value: number, severity: PerformanceSeverity) => void) => void;
  onRecommendationsGenerated: (callback: (recommendations: PerformanceRecommendation[]) => void) => void;
}

/**
 * Hook for managing map performance profiler
 */
export function useMapPerformanceProfiler(
  config?: Partial<MapPerformanceProfilerConfig>
): UseMapPerformanceProfilerReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    renderTime: 0,
    scriptTime: 0,
    paintTime: 0,
    layoutShift: 0,
    longTasks: 0,
    interactionDelay: 0,
    networkRequests: 0,
    animationFrameDrops: 0,
    junk: 0,
    duration: 0,
    totalDuration: 0,
    selfTime: 0,
    timestamp: Date.now(),
  });
  const [statistics, setStatistics] = useState<PerformanceStatistics>({
    totalFrames: 0,
    averageFps: 0,
    averageFrameTime: 0,
    maxFrameTime: 0,
    minFrameTime: 0,
    p95FrameTime: 0,
    p99FrameTime: 0,
    averageMemoryUsage: 0,
    peakMemoryUsage: 0,
    averageCpuUsage: 0,
    totalJank: 0,
    totalLongTasks: 0,
    totalAnimationDrops: 0,
    sessionDuration: 0,
    recommendations: [],
  });
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);
  const [frameBuffer, setFrameBuffer] = useState<any[]>([]);
  const [isHUDVisible, setIsHUDVisible] = useState(true);
  const [isCompactMode, setIsCompactMode] = useState(false);

  // Refs for engine and exporter
  const engineRef = useRef<MapPerformanceProfilerEngine | null>(null);
  const exporterRef = useRef<MapPerformanceProfilerExporter | null>(null);
  const eventListenersRef = useRef<Map<string, Function>>(new Map());

  // Initialize engine and exporter
  useEffect(() => {
    const engine = new MapPerformanceProfilerEngine(config);
    const exporter = new MapPerformanceProfilerExporter(config);
    
    engineRef.current = engine;
    exporterRef.current = exporter;

    // Set up event listeners
    engine.addEventListener('metrics-updated', handleMetricsUpdated);
    engine.addEventListener('threshold-exceeded', handleThresholdExceeded);
    engine.addEventListener('recommendations-generated', handleRecommendationsGenerated);
    engine.addEventListener('error', handleError);

    // Auto-start if configured
    if (config?.autoStart) {
      engine.start();
      setIsRunning(true);
    }

    return () => {
      engine.removeEventListener('metrics-updated', handleMetricsUpdated);
      engine.removeEventListener('threshold-exceeded', handleThresholdExceeded);
      engine.removeEventListener('recommendations-generated', handleRecommendationsGenerated);
      engine.removeEventListener('error', handleError);
      engine.destroy();
    };
  }, [config]);

  // Event handlers
  const handleMetricsUpdated = useCallback((data: { metrics: PerformanceMetrics; statistics: PerformanceStatistics }) => {
    setMetrics(data.metrics);
    setStatistics(data.statistics);
    setFrameBuffer(engineRef.current?.getFrameBuffer() || []);
  }, []);

  const handleThresholdExceeded = useCallback((data: { metric: PerformanceMetricType; value: number; severity: PerformanceSeverity }) => {
    const listener = eventListenersRef.current.get('threshold-exceeded');
    if (listener) {
      listener(data.metric, data.value, data.severity);
    }
  }, []);

  const handleRecommendationsGenerated = useCallback((data: { recommendations: PerformanceRecommendation[] }) => {
    setRecommendations(data.recommendations);
    const listener = eventListenersRef.current.get('recommendations-generated');
    if (listener) {
      listener(data.recommendations);
    }
  }, []);

  const handleError = useCallback((data: { error: Error; context: string }) => {
    diagnostics.error('Performance profiler error', { error: data.error, context: data.context });
    const listener = eventListenersRef.current.get('error');
    if (listener) {
      listener(data.error, data.context);
    }
  }, []);

  // Actions
  const start = useCallback(() => {
    if (engineRef.current && !isRunning) {
      engineRef.current.start();
      setIsRunning(true);
    }
  }, [isRunning]);

  const stop = useCallback(() => {
    if (engineRef.current && isRunning) {
      engineRef.current.stop();
      setIsRunning(false);
    }
  }, [isRunning]);

  const toggleHUD = useCallback(() => {
    setIsHUDVisible(prev => !prev);
  }, []);

  const toggleCompact = useCallback(() => {
    setIsCompactMode(prev => !prev);
  }, []);

  const clearData = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.clearData();
    }
  }, []);

  const exportData = useCallback((format: 'csv' | 'json') => {
    if (engineRef.current && exporterRef.current) {
      const data = engineRef.current.exportData();
      const content = exporterRef.current.export(data, { format });
      
      // Create download link
      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-data-${Date.now()}.${format}`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }
  }, []);

  const downloadData = useCallback((format: 'csv' | 'json') => {
    if (engineRef.current && exporterRef.current) {
      const data = engineRef.current.exportData();
      exporterRef.current.exportAndDownload(data, { format });
    }
  }, []);

  const updateConfig = useCallback((newConfig: Partial<MapPerformanceProfilerConfig>) => {
    if (engineRef.current) {
      engineRef.current.updateConfig(newConfig);
    }
    if (exporterRef.current) {
      exporterRef.current.updateConfig(newConfig);
    }
  }, []);

  const getConfig = useCallback(() => {
    return engineRef.current?.getConfig() || DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG;
  }, []);

  const analyzePerformance = useCallback(() => {
    if (engineRef.current) {
      return engineRef.current.analyzePerformance();
    }
    return null;
  }, []);

  const getRecentEntries = useCallback((count?: number) => {
    if (engineRef.current) {
      return engineRef.current.getRecentEntries(count);
    }
    return [];
  }, []);

  // Event registration functions
  const onMetricsUpdated = useCallback((callback: (metrics: PerformanceMetrics) => void) => {
    eventListenersRef.current.set('metrics-updated', callback);
  }, []);

  const onThresholdExceeded = useCallback((callback: (metric: PerformanceMetricType, value: number, severity: PerformanceSeverity) => void) => {
    eventListenersRef.current.set('threshold-exceeded', callback);
  }, []);

  const onRecommendationsGenerated = useCallback((callback: (recommendations: PerformanceRecommendation[]) => void) => {
    eventListenersRef.current.set('recommendations-generated', callback);
  }, []);

  // Auto-export functionality
  useEffect(() => {
    if (!config?.export?.autoExport || !isRunning) {
      return;
    }

    const interval = setInterval(() => {
      exportData(config.export.format);
    }, config.export.autoExportInterval);

    return () => clearInterval(interval);
  }, [config?.export?.autoExport, config?.export?.autoExportInterval, config?.export?.format, isRunning, exportData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const hudConfig = config?.hud || DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.hud;
      
      if (event.key === hudConfig.toggleKey) {
        event.preventDefault();
        toggleHUD();
      }
      
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'e':
            event.preventDefault();
            exportData('csv');
            break;
          case 'j':
            event.preventDefault();
            exportData('json');
            break;
          case 'r':
            event.preventDefault();
            clearData();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config?.hud?.toggleKey, toggleHUD, exportData, clearData]);

  // Performance monitoring
  useEffect(() => {
    if (!config?.monitoring?.autoStart || !isRunning) {
      return;
    }

    const interval = setInterval(() => {
      if (engineRef.current) {
        const currentMetrics = engineRef.current.getCurrentMetrics();
        const currentStats = engineRef.current.getStatistics();
        
        // Check for critical performance issues
        if (currentMetrics.fps < 30 || currentMetrics.frameTime > 100) {
          diagnostics.warn('Critical performance issue detected', {
            fps: currentMetrics.fps,
            frameTime: currentMetrics.frameTime,
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [config?.monitoring?.autoStart, isRunning]);

  // Memory management
  useEffect(() => {
    if (!config?.monitoring?.maxBufferAge || !isRunning) {
      return;
    }

    const interval = setInterval(() => {
      if (engineRef.current) {
        const bufferAge = Date.now() - engineRef.current.getStatistics().sessionDuration;
        
        if (bufferAge > config.monitoring.maxBufferAge) {
          engineRef.current.clearData();
          diagnostics.info('Performance data cleared due to buffer age limit');
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [config?.monitoring?.maxBufferAge, isRunning]);

  return {
    // State
    isRunning,
    metrics,
    statistics,
    recommendations,
    frameBuffer,
    isHUDVisible,
    isCompactMode,
    
    // Actions
    start,
    stop,
    toggleHUD,
    toggleCompact,
    clearData,
    exportData,
    downloadData,
    
    // Configuration
    updateConfig,
    getConfig,
    
    // Analysis
    analyzePerformance,
    getRecentEntries,
    
    // Events
    onMetricsUpdated,
    onThresholdExceeded,
    onRecommendationsGenerated,
  };
}

/**
 * Hook for managing performance profiler HUD
 */
export function useMapPerformanceProfilerHUD(
  config?: Partial<MapPerformanceProfilerConfig>
) {
  const profiler = useMapPerformanceProfiler(config);
  
  const hudConfig = useMemo(() => ({
    ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.hud,
    ...config?.hud,
  }), [config?.hud]);

  const toggleHUD = useCallback(() => {
    profiler.toggleHUD();
  }, [profiler]);

  const toggleCompact = useCallback(() => {
    profiler.toggleCompact();
  }, [profiler]);

  const exportData = useCallback((format: 'csv' | 'json') => {
    profiler.exportData(format);
  }, [profiler]);

  return {
    ...profiler,
    hudConfig,
    toggleHUD,
    toggleCompact,
    exportData,
  };
}

/**
 * Hook for performance monitoring with automatic alerts
 */
export function usePerformanceAlerts(
  config?: Partial<MapPerformanceProfilerConfig>
) {
  const profiler = useMapPerformanceProfiler(config);
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: PerformanceMetricType;
    value: number;
    severity: PerformanceSeverity;
    timestamp: number;
    message: string;
  }>>([]);

  const onThresholdExceeded = useCallback((metric: PerformanceMetricType, value: number, severity: PerformanceSeverity) => {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: metric,
      value,
      severity,
      timestamp: Date.now(),
      message: `${metric}: ${value} (${severity})`,
    };

    setAlerts(prev => [...prev.slice(-9), alert]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 5000);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  useEffect(() => {
    profiler.onThresholdExceeded(onThresholdExceeded);
  }, [profiler, onThresholdExceeded]);

  return {
    alerts,
    clearAlerts,
    dismissAlert,
    ...profiler,
  };
}

/**
 * Hook for performance data export
 */
export function usePerformanceExport(
  config?: Partial<MapPerformanceProfilerConfig>
) {
  const profiler = useMapPerformanceProfiler(config);
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{
    timestamp: number;
    format: string;
    records: number;
  } | null>(null);

  const exportData = useCallback(async (format: 'csv' | 'json') => {
    setIsExporting(true);
    
    try {
      profiler.exportData(format);
      
      setLastExport({
        timestamp: Date.now(),
        format,
        records: profiler.statistics.totalFrames,
      });
      
      diagnostics.info('Data exported successfully', {
        format,
        records: profiler.statistics.totalFrames,
      });
    } catch (error) {
      diagnostics.error('Export failed', { error });
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [profiler]);

  const downloadData = useCallback(async (format: 'csv' | 'json') => {
    setIsExporting(true);
    
    try {
      profiler.downloadData(format);
      
      setLastExport({
        timestamp: Date.now(),
        format,
        records: profiler.statistics.totalFrames,
      });
      
      diagnostics.info('Data downloaded successfully', {
        format,
        records: profiler.statistics.totalFrames,
      });
    } catch (error) {
      diagnostics.error('Download failed', { error });
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [profiler]);

  return {
    ...profiler,
    isExporting,
    lastExport,
    exportData,
    downloadData,
  };
}

/**
 * Hook for performance analysis
 */
export function usePerformanceAnalysis(
  config?: Partial<MapPerformanceProfilerConfig>
) {
  const profiler = useMapPerformanceProfiler(config);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);

  const performAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      const result = profiler.analyzePerformance();
      setAnalysis(result);
      
      // Add to history
      const analysisEntry = {
        timestamp: Date.now(),
        result,
        metrics: profiler.metrics,
        statistics: profiler.statistics,
      };
      
      setAnalysisHistory(prev => [...prev.slice(-9), analysisEntry]);
      
      diagnostics.info('Performance analysis completed', {
        score: result?.metrics?.fps || 0,
        severity: result?.severity || 'unknown',
      });
    } catch (error) {
      diagnostics.error('Analysis failed', { error });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [profiler]);

  const clearAnalysisHistory = useCallback(() => {
    setAnalysisHistory([]);
  }, []);

  return {
    ...profiler,
    analysis,
    isAnalyzing,
    analysisHistory,
    performAnalysis,
    clearAnalysisHistory,
  };
}
