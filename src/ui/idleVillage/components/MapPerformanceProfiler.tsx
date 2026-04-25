/**
 * Map Performance Profiler Component - NP-024
 * 
 * Main React component for the Idle Village Map Performance Profiler.
 * Integrates the profiler engine, HUD, and export functionality
 * into a complete performance monitoring solution.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { MapPerformanceProfilerEngine } from '../utils/mapPerformanceProfilerEngine';
import { MapPerformanceProfilerHUD } from './MapPerformanceProfilerHUD';
import {
  type MapPerformanceProfilerConfig,
  type PerformanceMetrics,
  type PerformanceStatistics,
  type PerformanceRecommendation,
  DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
} from '../config/mapPerformanceProfilerConfig';
import { useMapPerformanceProfiler } from '../hooks/useMapPerformanceProfiler';

const diagnostics = createSandboxDiagnostics('MapPerformanceProfiler', 'component');

/**
 * Props for MapPerformanceProfiler component
 */
export interface MapPerformanceProfilerProps {
  /** Configuration for the profiler */
  config?: Partial<MapPerformanceProfilerConfig>;
  /** Custom CSS class names */
  className?: string;
  /** Whether profiler is visible */
  visible?: boolean;
  /** Whether to show HUD */
  showHUD?: boolean;
  /** Whether to show controls */
  showControls?: boolean;
  /** Whether to show export options */
  showExport?: boolean;
  /** Whether to show analysis */
  showAnalysis?: boolean;
  /** Whether to auto-start */
  autoStart?: boolean;
  /** Callback for configuration changes */
  onConfigChange?: (config: MapPerformanceProfilerConfig) => void;
  /** Callback for export events */
  onExport?: (format: 'csv' | 'json', data: any) => void;
  /** Callback for analysis events */
  onAnalysis?: (analysis: any) => void;
  /** Callback for threshold violations */
  onThresholdExceeded?: (metric: string, value: number, severity: string) => void;
}

/**
 * Main Map Performance Profiler component
 */
export const MapPerformanceProfiler: React.FC<MapPerformanceProfilerProps> = ({
  config: userConfig,
  className = '',
  visible = true,
  showHUD = true,
  showControls = true,
  showExport = true,
  showAnalysis = false,
  autoStart = true,
  onConfigChange,
  onExport,
  onAnalysis,
  onThresholdExceeded,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
    ...userConfig,
  }), [userConfig]);

  const profiler = useMapPerformanceProfiler(config);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(showAnalysis);
  const [isControlsVisible, setIsControlsVisible] = useState(showControls);
  const [isExportVisible, setIsExportVisible] = useState(showExport);

  // Handle configuration changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(profiler.getConfig());
    }
  }, [profiler.getConfig, onConfigChange]);

  // Handle export events
  useEffect(() => {
    if (onExport) {
      profiler.onMetricsUpdated((metrics) => {
        onExport('metrics', metrics);
      });
    }
  }, [profiler.onMetricsUpdated, onExport]);

  // Handle analysis events
  useEffect(() => {
    if (onAnalysis) {
      profiler.onRecommendationsGenerated((recommendations) => {
        onAnalysis({ recommendations, metrics: profiler.metrics, statistics: profiler.statistics });
      });
    }
  }, [profiler.onRecommendationsGenerated, onAnalysis]);

  // Handle threshold violations
  useEffect(() => {
    if (onThresholdExceeded) {
      profiler.onThresholdExceeded((metric, value, severity) => {
        onThresholdExceeded(metric, value, severity);
      });
    }
  }, [profiler.onThresholdExceeded, onThresholdExceeded]);

  // Auto-start functionality
  useEffect(() => {
    if (autoStart && !profiler.isRunning) {
      profiler.start();
    }
  }, [autoStart, profiler.isRunning]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'h':
            event.preventDefault();
            setIsAnalysisVisible(!isAnalysisVisible);
            break;
          case 'c':
            event.preventDefault();
            setIsControlsVisible(!isControlsVisible);
            break;
          case 'e':
            event.preventDefault();
            setIsExportVisible(!isExportVisible);
            break;
          case 'p':
            event.preventDefault();
            profiler.exportData('csv');
            break;
          case 'j':
            event.preventDefault();
            profiler.exportData('json');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnalysisVisible, isControlsVisible, isExportVisible, profiler.exportData]);

  // Performance analysis
  const performAnalysis = useCallback(() => {
    const analysis = profiler.analyzePerformance();
    if (analysis && onAnalysis) {
      onAnalysis(analysis);
    }
    return analysis;
  }, [profiler.analyzePerformance, onAnalysis]);

  // Get performance score
  const performanceScore = useMemo(() => {
    const fps = profiler.metrics.fps;
    const frameTime = profiler.metrics.frameTime;
    const memoryUsage = profiler.metrics.memoryUsage;
    const cpuUsage = profiler.metrics.cpuUsage;
    
    // Simple scoring algorithm
    let score = 100;
    
    // FPS scoring (40% weight)
    if (fps >= 60) {
      score += 0;
    } else if (fps >= 45) {
      score -= 10;
    } else if (fps >= 30) {
      score -= 30;
    } else {
      score -= 50;
    }
    
    // Frame time scoring (30% weight)
    if (frameTime <= 16.67) {
      score += 0;
    } else if (frameTime <= 33.33) {
      score -= 10;
    } else if (frameTime <= 50) {
      score -= 20;
    } else {
      score -= 40;
    }
    
    // Memory usage scoring (20% weight)
    if (memoryUsage <= 100) {
      score += 0;
    } else if (memoryUsage <= 200) {
      score -= 10;
    } else if (memoryUsage <= 500) {
      score -= 20;
    } else {
      score -= 40;
    }
    
    // CPU usage scoring (10% weight)
    if (cpuUsage <= 25) {
      score += 0;
    } else if (cpuUsage <= 50) {
      score -= 10;
    } else if (cpuUsage <= 80) {
      score -= 20;
    } else {
      score -= 40;
    }
    
    return Math.max(0, score);
  }, [profiler.metrics.fps, profiler.metrics.frameTime, profiler.metrics.memoryUsage, profiler.metrics.cpuUsage]);

  // Get severity color
  const getSeverityColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSeverityBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-900/50';
    if (score >= 60) return 'bg-yellow-900/50';
    if (score >= 40) return 'bg-orange-900/50';
    return 'bg-red-900/50';
  };

  if (!visible) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      {/* Performance Score Indicator */}
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-full ${getSeverityBgColor(performanceScore)} mb-2`}
        title={`Performance Score: ${performanceScore}`}
      >
        <span className={`text-sm font-bold ${getSeverityColor(performanceScore)}`}>
          {performanceScore}
        </span>
      </div>

      {/* HUD Overlay */}
      {showHUD && (
        <MapPerformanceProfilerHUD
          metrics={profiler.metrics}
          statistics={profiler.statistics}
          recommendations={profiler.recommendations}
          config={config.hud}
          onToggle={profiler.toggleHUD}
          onExport={profiler.exportData}
          onClear={profiler.clearData}
          visible={profiler.isHUDVisible}
          compact={profiler.isCompactMode}
        />
      )}

      {/* Controls */}
      {showControls && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 mb-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white">Performance Profiler</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => profiler.start()}
                disabled={profiler.isRunning}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  profiler.isRunning
                    ? 'bg-gray-600 text-gray-400'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {profiler.isRunning ? 'Stop' : 'Start'}
              </button>
              
              <button
                onClick={() => profiler.stop()}
                disabled={!profiler.isRunning}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  !profiler.isRunning
                    ? 'bg-gray-600 text-gray-400'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Stop
              </button>
              
              <button
                onClick={profiler.clearData}
                className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="text-xs text-gray-300 mb-2">
            Status: {profiler.isRunning ? 'Running' : 'Stopped'}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-2">
            <div>
              <span className="text-gray-400">FPS:</span>
              <span className={getSeverityColor(profiler.metrics.fps)}>
                {profiler.metrics.fps.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Frame Time:</span>
              <span className={getSeverityColor(profiler.metrics.frameTime)}>
                {profiler.metrics.frameTime.toFixed(2)}ms
              </span>
            </div>
            <div>
              <span className="text-gray-400">Memory:</span>
              <span className={getSeverityColor(profiler.metrics.memoryUsage)}>
                {(profiler.metrics.memoryUsage / 1024).toFixed(1)}MB
              </span>
            </div>
            <div>
              <span className="text-gray-400">CPU:</span>
              <span className={getSeverityColor(profiler.metrics.cpuUsage)}>
                {profiler.metrics.cpuUsage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Export Options */}
          {showExport && (
            <div className="flex flex-col space-y-1 mb-2">
              <button
                onClick={() => profiler.exportData('csv')}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
              >
                Export CSV
              </button>
              
              <button
                onClick={() => profiler.exportData('json')}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
              >
                Export JSON
              </button>
            </div>
          )}

          {/* Analysis Options */}
          {showAnalysis && (
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => {
                  const analysis = performAnalysis();
                  setIsAnalysisVisible(true);
                }}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition-colors"
              >
                Analyze Performance
              </button>
              
              {isAnalysisVisible && (
                <div className="bg-gray-800 border border-gray-600 rounded p-2">
                  <h4 className="text-xs font-semibold text-white mb-2">Performance Analysis</h4>
                  <div className="text-xs text-gray-300">
                    <div className="mb-1">
                      <span className="text-gray-400">Score:</span>
                      <span className={getSeverityColor(performanceScore)}>
                        {performanceScore}/100
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="text-gray-400">Total Frames:</span>
                      <span>{profiler.statistics.totalFrames}</span>
                    </div>
                    <div className="mb-1">
                      <span className="text-gray-400">Session Duration:</span>
                      <span>{Math.round(profiler.statistics.sessionDuration / 1000)}s</span>
                    </div>
                    <div className="mb-1">
                      <span className="text-gray-400">P95 Frame Time:</span>
                      <span>{profiler.statistics.p95FrameTime.toFixed(2)}ms</span>
                    </div>
                    <div className="mb-1">
                      <span className="text-gray-400">Peak Memory:</span>
                      <span>{profiler.statistics.peakMemoryUsage.toFixed(1)}MB</span>
                    </div>
                  </div>
                  
                  {profiler.recommendations.length > 0 && (
                    <div className="mt-2">
                      <h5 className="text-xs font-semibold text-white mb-1">Recommendations</h5>
                      <div className="space-y-1">
                        {profiler.recommendations.slice(0, 3).map((recommendation, index) => (
                          <div key={index} className="text-xs text-gray-300">
                            • {recommendation.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Compact Map Performance Profiler component
 */
export const CompactMapPerformanceProfiler: React.FC<MapPerformanceProfilerProps> = ({
  config: userConfig,
  className = '',
  visible = true,
  showHUD = true,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
    ...userConfig,
  }), [userConfig]);

  const profiler = useMapPerformanceProfiler(config);

  if (!visible) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 ${className}`}>
      <MapPerformanceProfilerHUD
        metrics={profiler.metrics}
        statistics={profiler.statistics}
        recommendations={profiler.recommendations}
        config={config.hud}
        onToggle={profiler.toggleHUD}
        visible={profiler.isHUDVisible}
        compact={true}
      />
    </div>
  );
};

/**
 * Full-screen Map Performance Profiler component
 */
export const FullScreenMapPerformanceProfiler: React.FC<MapPerformanceProfilerProps> = ({
  config: userConfig,
  className = '',
  visible = true,
  showHUD = true,
  showControls = true,
  showExport = true,
  showAnalysis = true,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
    ...userConfig,
    hud: {
      ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.hud,
      width: 400,
      height: 300,
      position: 'top-right',
    },
  }), [userConfig]);

  const profiler = useMapPerformanceProfiler(config);

  if (!visible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-90 z-50 ${className}`}>
      <MapPerformanceProfiler
        config={config}
        visible={visible}
        showHUD={showHUD}
        showControls={showControls}
        showExport={showExport}
        showAnalysis={showAnalysis}
        onConfigChange={onConfigChange}
        onExport={onExport}
        onAnalysis={onAnalysis}
        onThresholdExceeded={onThresholdExceeded}
      />
    </div>
  );
};

/**
 * Floating Map Performance Profiler component
 */
export const FloatingMapPerformanceProfiler: React.FC<MapPerformanceProfilerProps> = ({
  config: userConfig,
  className = '',
  visible = true,
  showHUD = true,
  showControls = true,
  showExport = true,
  showAnalysis = true,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
    ...userConfig,
    hud: {
      ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.hud,
      position: 'floating',
      width: 350,
      height: 250,
    },
  }), [userConfig]);

  const profiler = useMapPerformanceProfiler(config);

  if (!visible) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-4 ${className}`}>
      <MapPerformanceProfiler
        config={config}
        visible={visible}
        showHUD={showHUD}
        showControls={showControls}
        showExport={showExport}
        showAnalysis={showAnalysis}
        onConfigChange={onConfigChange}
        onExport={onExport}
        onAnalysis={onAnalysis}
        onThresholdExceeded={onThresholdExceeded}
      />
    </div>
  );
};

/**
 * Minimal Map Performance Profiler component
 */
export const MinimalMapPerformanceProfiler: React.FC<MapPerformanceProfilerProps> = ({
  config: userConfig,
  className = '',
  visible = true,
  showHUD = true,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
    ...userConfig,
    hud: {
      ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.hud,
      width: 200,
      height: 150,
      position: 'top-right',
      compact: true,
      showControls: false,
      showTimestamp: false,
      showRecommendations: false,
    },
  }), [userConfig]);

  const profiler = useMapPerformanceProfiler(config);

  if (!visible) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 ${className}`}>
      <MapPerformanceProfilerHUD
        metrics={profiler.metrics}
        statistics={profiler.statistics}
        recommendations={profiler.recommendations}
        config={config.hud}
        visible={profiler.isHUDVisible}
        compact={true}
      />
    </div>
  );
};

/**
 * Performance Metrics Display component
 */
export interface PerformanceMetricsDisplayProps {
  metrics: PerformanceMetrics;
  showTitle?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const PerformanceMetricsDisplay: React.FC<PerformanceDisplayProps> = ({
  metrics,
  showTitle = true,
  showDetails = true,
  className = '',
}) => {
  const getSeverityColor = (value: number, type: string): string => {
    switch (type) {
      case 'fps':
        if (value >= 60) return 'text-green-400';
        if (value >= 45) return 'text-yellow-400';
        return 'text-red-400';
      case 'frameTime':
        if (value <= 16.67) return 'text-green-400';
        if (value <= 33.33) return 'text-yellow-400';
        return 'text-red-400';
      case 'memoryUsage':
        if (value <= 100) return 'text-green-400';
        if (value <= 200) return 'text-yellow-400';
        return 'text-red-400';
      case 'cpuUsage':
        if (value <= 25) return 'text-green-400';
        if (value <= 50) return 'text-yellow-400';
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-gray-800 border border-gray-600 rounded p-3 ${className}`}>
      {showTitle && (
        <h3 className="text-sm font-semibold text-white mb-2">Performance Metrics</h3>
      )}
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">FPS:</span>
          <span className={`text-xs font-mono ${getSeverityColor(metrics.fps, 'fps')}`}>
            {metrics.fps.toFixed(1)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">Frame Time:</span>
          <span className={`text-xs font-mono ${getSeverityColor(metrics.frameTime, 'frameTime')}`}>
            {metrics.frameTime.toFixed(2)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">Memory:</span>
          <span className={`text-xs font-mono ${getSeverityColor(metrics.memoryUsage, 'memoryUsage')}`}>
            {(metrics.memoryUsage / 1024).toFixed(1)}MB
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">CPU:</span>
          <span className={`text-xs font-mono ${getSeverityColor(metrics.cpuUsage, 'cpuUsage')}`}>
            {metrics.cpuUsage.toFixed(1)}%
          </span>
        </div>
        
        {showDetails && (
          <>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Render:</span>
              <span className={`text-xs font-mono ${getSeverityColor(metrics.renderTime, 'renderTime')}`}>
                {metrics.renderTime.toFixed(2)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Script:</span>
              <span className={`text-xs font-mono ${getSeverity(metrics.scriptTime, 'scriptTime')}`}>
                {metrics.scriptTime.toFixed(2)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Paint:</span>
              <span className={`text-xs font-mono ${getSeverity(metrics.paintTime, 'paintTime')}`}>
                {metrics.paintTime.toFixed(2)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Layout Shift:</span>
              <span className={`text-xs font-mono ${getSeverity(metrics.layoutShift, 'layoutShift')}`}>
                {metrics.layoutShift}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Long Tasks:</span>
              <span className={`text-xs font-mono ${getSeverity(metrics.longTasks, 'longTasks')}`}>
                {metrics.longTasks}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Animation Drops:</span>
              <span className={`text-xs font-mono ${getSeverity(metrics.animationFrameDrops, 'animationFrameDrops')}`}>
                {metrics.animationFrameDrops}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Jank:</span>
              <span className={`text-xs font-mono ${getSeverity(metrics.junk, 'junk')}`}>
                {metrics.junk.toFixed(1)}%
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Performance Recommendations Display component
 */
export interface PerformanceRecommendationsDisplayProps {
  recommendations: PerformanceRecommendation[];
  showTitle?: boolean;
  showImpact?: boolean;
  showApplied?: boolean;
  className?: string;
}

export const PerformanceRecommendationsDisplay: React.FC<PerformanceRecommendationsDisplayProps> = ({
  recommendations,
  showTitle = true,
  showImpact = true,
  showApplied = false,
  className = '',
}) => {
  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getImpactBgColor = (impact: string): string => {
    switch (impact) {
      case 'critical': return 'bg-red-900/50';
      case 'high': return 'bg-orange-900/50';
      case 'medium': return 'bg-yellow-900/50';
      case 'low': return 'b-green-900/50';
      default: return 'bg-gray-900/50';
    }
  };

  if (recommendations.length === 0) {
    return (
        <div className={`text-xs text-gray-400 text-center py-4 ${className}`}>
          No recommendations available
        </div>
      );
    }

  return (
    <div className={`bg-gray-800 border border-gray-600 rounded p-3 ${className}`}>
      {showTitle && (
        <h3 className="text-sm font-semibold text-white mb-2">Performance Recommendations</h3>
      )}
      
      <div className="space-y-2">
        {recommendations.map((recommendation, index) => (
          <div
            key={recommendation.id}
            className={`p-2 bg-gray-700 rounded border border-gray-600 ${
              recommendation.applied ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-semibold text-white">{recommendation.title}</h4>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${getImpactColor(recommendation.impact)}`}>
                  {recommendation.impact}
                </span>
                {showApplied && (
                  <span className="text-xs text-green-400">
                    {recommendation.applied ? 'Applied' : 'Pending'}
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-300 mb-2">{recommendation.description}</p>
            <p className="text-xs text-gray-400">{recommendation.suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Performance Statistics Display component
 */
export interface PerformanceStatisticsDisplayProps {
  statistics: PerformanceStatistics;
  showTitle?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const PerformanceStatisticsDisplay: React.FC<PerformanceStatisticsDisplayProps> = ({
  statistics,
  showTitle = true,
  showDetails = true,
  className = '',
}) => {
  if (statistics.totalFrames === 0) {
    return (
      <div className={`text-xs text-gray-400 text-center py-4 ${className}`}>
        No statistics available
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 border border-gray-600 rounded p-3 ${className}`}>
      {showTitle && (
        <h3 className="text-sm font-semibold text-white mb-2">Performance Statistics</h3>
      )}
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">Session Duration:</span>
          <span className="text-xs text-gray-300">
            {Math.round(statistics.sessionDuration / 1000)}s
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">Total Frames:</span>
          <span className="text-xs text-gray-300">{statistics.totalFrames}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">Average FPS:</span>
          <span className="text-xs text-gray-300">
            {statistics.averageFps.toFixed(1)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-xs text-gray-400">Average Frame Time:</span>
          <span className="text-xs text-gray-300">
            {statistics.averageFrameTime.toFixed(2)}ms
          </span>
        </div>
        
        {showDetails && (
          <>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Max Frame Time:</span>
              <span className="text-xs text-gray-300">
                {statistics.maxFrameTime.toFixed(2)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Min Frame Time:</span>
              <span className="text-xs text-gray-300">
                {statistics.minFrameTime.toFixed(2)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">P95 Frame Time:</span>
              <span className="text-xs text-gray-300">
                {statistics.p95FrameTime.toFixed(2)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">P99 Frame Time:</span>
              <span className="text-xs text-gray-300">
                {statistics.p99FrameTime.toFixed(2)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Peak Memory:</span>
              <span className="text-xs text-gray-300">
                {statistics.peakMemoryUsage.toFixed(1)}MB
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Average Memory:</span>
              <span className="text-xs text-gray-300">
                {statistics.averageMemoryUsage.toFixed(1)}MB
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Average CPU:</span>
              <span className="text-xs text-gray-300">
                {statistics.averageCpuUsage.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Total Long Tasks:</span>
              <span className="text-xs text-gray-300">
                {statistics.totalLongTasks}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Animation Drops:</span>
              <span className="text-xs text-gray-300">
                {statistics.totalAnimationDrops}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MapPerformanceProfiler;
