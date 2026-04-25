/**
 * Map Performance Profiler HUD Component - NP-024
 * 
 * HUD overlay component for displaying real-time performance metrics.
 * Provides visual feedback for frame-time, costs, and performance analysis.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type MapPerformanceProfilerConfig,
  type PerformanceMetrics,
  type PerformanceStatistics,
  type PerformanceRecommendation,
  PerformanceMetricType,
  PerformanceSeverity,
  formatPerformanceValue,
  formatTimestamp,
  calculatePerformanceScore,
} from '../config/mapPerformanceProfilerConfig';

const diagnostics = createSandboxDiagnostics('MapPerformanceProfilerHUD', 'hud');

/**
 * Props for MapPerformanceProfilerHUD component
 */
export interface MapPerformanceProfilerHUDProps {
  /** Current performance metrics */
  metrics: PerformanceMetrics;
  /** Performance statistics */
  statistics: PerformanceStatistics;
  /** Performance recommendations */
  recommendations: PerformanceRecommendation[];
  /** Configuration for the HUD */
  config?: Partial<MapPerformanceProfilerConfig['hud']>;
  /** Callback for toggle visibility */
  onToggle?: (visible: boolean) => void;
  /** Callback for export data */
  onExport?: (format: 'csv' | 'json') => void;
  /** Callback for clear data */
  onClear?: () => void;
  /** Custom CSS class names */
  className?: string;
  /** Whether HUD is visible */
  visible?: boolean;
  /** Whether HUD is in compact mode */
  compact?: boolean;
}

/**
 * Individual metric display component
 */
interface MetricDisplayProps {
  label: string;
  value: number;
  metric: PerformanceMetricType;
  severity: PerformanceSeverity;
  showThreshold?: boolean;
  format?: boolean;
}

const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  metric,
  severity,
  showThreshold = true,
  format = true,
}) => {
  const getSeverityColor = (sev: PerformanceSeverity): string => {
    switch (sev) {
      case PerformanceSeverity.CRITICAL: return 'text-red-400';
      case PerformanceSeverity.WARNING: return 'text-yellow-400';
      case PerformanceSeverity.GOOD: return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityBgColor = (sev: PerformanceSeverity): string => {
    switch (sev) {
      case PerformanceSeverity.CRITICAL: return 'bg-red-900/50';
      case PerformanceSeverity.WARNING: return 'bg-yellow-900/50';
      case PerformanceSeverity.GOOD: return 'bg-green-900/50';
      default: return 'bg-gray-900/50';
    }
  };

  return (
    <div className={`flex items-center justify-between p-1 rounded ${getSeverityBgColor(severity)}`}>
      <span className="text-xs text-gray-300">{label}:</span>
      <span className={`text-xs font-mono ${getSeverityColor(severity)}`}>
        {format ? formatPerformanceValue(metric, value) : value}
      </span>
    </div>
  );
};

/**
 * Performance score component
 */
interface PerformanceScoreProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
}

const PerformanceScore: React.FC<PerformanceScoreProps> = ({ score, size = 'medium' }) => {
  const getSizeClasses = (size: string): string => {
    switch (size) {
      case 'small': return 'w-8 h-8 text-xs';
      case 'large': return 'w-16 h-16 text-lg';
      default: return 'w-12 h-12 text-sm';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-900/50';
    if (score >= 60) return 'bg-yellow-900/50';
    if (score >= 40) return 'bg-orange-900/50';
    return 'bg-red-900/50';
  };

  return (
    <div className={`flex items-center justify-center rounded-full ${getSizeClasses(size)} ${getScoreBgColor(score)}`}>
      <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
    </div>
  );
};

/**
 * Recommendation component
 */
interface RecommendationProps {
  recommendation: PerformanceRecommendation;
  onApply?: (id: string) => void;
}

const Recommendation: React.FC<RecommendationProps> = ({ recommendation, onApply }) => {
  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="p-2 bg-gray-800 rounded border border-gray-600">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-semibold text-white">{recommendation.title}</h4>
        <span className={`text-xs ${getImpactColor(recommendation.impact)}`}>
          {recommendation.impact}
        </span>
      </div>
      <p className="text-xs text-gray-300 mb-2">{recommendation.description}</p>
      <p className="text-xs text-gray-400 mb-2">{recommendation.suggestion}</p>
      {onApply && !recommendation.applied && (
        <button
          onClick={() => onApply(recommendation.id)}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
        >
          Apply
        </button>
      )}
      {recommendation.applied && (
        <span className="text-xs text-green-400">Applied</span>
      )}
    </div>
  );
};

/**
 * Main Map Performance Profiler HUD component
 */
export const MapPerformanceProfilerHUD: React.FC<MapPerformanceProfilerHUDProps> = ({
  metrics,
  statistics,
  recommendations,
  config: userConfig,
  onToggle,
  onExport,
  onClear,
  className = '',
  visible = true,
  compact = false,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.hud,
    ...userConfig,
  }), [userConfig]);

  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'metrics' | 'statistics' | 'recommendations'>('metrics');
  const hudRef = useRef<HTMLDivElement>(null);

  // Calculate performance score
  const performanceScore = useMemo(() => {
    return calculatePerformanceScore(metrics);
  }, [metrics]);

  // Get severity for metrics
  const getMetricSeverity = useCallback((metric: PerformanceMetricType, value: number): PerformanceSeverity => {
    if (metric === PerformanceMetricType.FPS) {
      if (value >= 60) return PerformanceSeverity.GOOD;
      if (value >= 45) return PerformanceSeverity.WARNING;
      return PerformanceSeverity.CRITICAL;
    }
    if (metric === PerformanceMetricType.FRAME_TIME) {
      if (value <= 16.67) return PerformanceSeverity.GOOD;
      if (value <= 33.33) return PerformanceSeverity.WARNING;
      return PerformanceSeverity.CRITICAL;
    }
    if (metric === PerformanceMetricType.MEMORY_USAGE) {
      if (value <= 200) return PerformanceSeverity.GOOD;
      if (value <= 500) return PerformanceSeverity.WARNING;
      return PerformanceSeverity.CRITICAL;
    }
    if (metric === PerformanceMetricType.CPU_USAGE) {
      if (value <= 50) return PerformanceSeverity.GOOD;
      if (value <= 80) return PerformanceSeverity.WARNING;
      return PerformanceSeverity.CRITICAL;
    }
    return PerformanceSeverity.UNKNOWN;
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === config.toggleKey) {
        event.preventDefault();
        onToggle?.(!visible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.toggleKey, visible, onToggle]);

  // Handle auto-hide
  useEffect(() => {
    if (!config.autoHide) return;

    const timeout = setTimeout(() => {
      setIsExpanded(false);
    }, config.autoHideDelay);

    return () => clearTimeout(timeout);
  }, [config.autoHide, config.autoHideDelay]);

  if (!visible) {
    return null;
  }

  const getPositionClasses = (): string => {
    switch (config.position) {
      case 'top-left': return 'top-0 left-0';
      case 'top-right': return 'top-0 right-0';
      case 'bottom-left': return 'bottom-0 left-0';
      case 'bottom-right': return 'bottom-0 right-0';
      case 'center': return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default: return 'top-0 right-0';
    }
  };

  return (
    <div
      ref={hudRef}
      className={`fixed ${getPositionClasses()} ${className}`}
      style={{
        width: config.width,
        maxHeight: config.maxHeight,
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
        borderWidth: config.borderWidth,
        borderRadius: config.borderRadius,
        padding: config.padding,
        margin: config.margin,
        opacity: config.opacity,
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <PerformanceScore score={performanceScore} size="small" />
          <h3 className="text-sm font-semibold text-white">Performance</h3>
        </div>
        
        <div className="flex items-center space-x-1">
          {showControls && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <span className="text-xs">{isExpanded ? '▼' : '▲'}</span>
              </button>
              
              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Toggle recommendations"
              >
                <span className="text-xs">!</span>
              </button>
              
              <button
                onClick={() => onToggle?.(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Close"
              >
                <span className="text-xs">×</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Tab Navigation */}
          <div className="flex items-center space-x-2 mb-2 border-b border-gray-600">
            {(['metrics', 'statistics', 'recommendations'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-64 overflow-y-auto">
            {selectedTab === 'metrics' && (
              <div className="space-y-1">
                {config.showTimestamp && (
                  <div className="text-xs text-gray-400 mb-2">
                    {formatTimestamp(metrics.timestamp)}
                  </div>
                )}
                
                <MetricDisplay
                  label="FPS"
                  value={metrics.fps}
                  metric={PerformanceMetricType.FPS}
                  severity={getMetricSeverity(PerformanceMetricType.FPS, metrics.fps)}
                />
                
                <MetricDisplay
                  label="Frame Time"
                  value={metrics.frameTime}
                  metric={PerformanceMetricType.FRAME_TIME}
                  severity={getMetricSeverity(PerformanceMetricType.FRAME_TIME, metrics.frameTime)}
                />
                
                <MetricDisplay
                  label="Memory"
                  value={metrics.memoryUsage}
                  metric={PerformanceMetricType.MEMORY_USAGE}
                  severity={getMetricSeverity(PerformanceMetricType.MEMORY_USAGE, metrics.memoryUsage)}
                />
                
                <MetricDisplay
                  label="CPU"
                  value={metrics.cpuUsage}
                  metric={PerformanceMetricType.CPU_USAGE}
                  severity={getMetricSeverity(PerformanceMetricType.CPU_USAGE, metrics.cpuUsage)}
                />
                
                <MetricDisplay
                  label="Render"
                  value={metrics.renderTime}
                  metric={PerformanceMetricType.RENDER_TIME}
                  severity={getMetricSeverity(PerformanceMetricType.RENDER_TIME, metrics.renderTime)}
                />
                
                <MetricDisplay
                  label="Script"
                  value={metrics.scriptTime}
                  metric={PerformanceMetricType.SCRIPT_TIME}
                  severity={getMetricSeverity(PerformanceMetricType.SCRIPT_TIME, metrics.scriptTime)}
                />
                
                <MetricDisplay
                  label="Paint"
                  value={metrics.paintTime}
                  metric={PerformanceMetricType.PAINT_TIME}
                  severity={getMetricSeverity(PerformanceMetricType.PAINT_TIME, metrics.paintTime)}
                />
                
                <MetricDisplay
                  label="Layout Shift"
                  value={metrics.layoutShift}
                  metric={PerformanceMetricType.LAYOUT_SHIFT}
                  severity={getMetricSeverity(PerformanceMetricType.LAYOUT_SHIFT, metrics.layoutShift)}
                />
              </div>
            )}

            {selectedTab === 'statistics' && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400">
                  Session Duration: {Math.round(statistics.sessionDuration / 1000)}s
                </div>
                
                <div className="text-xs text-gray-400">
                  Total Frames: {statistics.totalFrames}
                </div>
                
                <div className="text-xs text-gray-400">
                  Average FPS: {statistics.averageFps.toFixed(1)}
                </div>
                
                <div className="text-xs text-gray-400">
                  Average Frame Time: {statistics.averageFrameTime.toFixed(2)}ms
                </div>
                
                <div className="text-xs text-gray-400">
                  Max Frame Time: {statistics.maxFrameTime.toFixed(2)}ms
                </div>
                
                <div className="text-xs text-gray-400">
                  P95 Frame Time: {statistics.p95FrameTime.toFixed(2)}ms
                </div>
                
                <div className="text-xs text-gray-400">
                  P99 Frame Time: {statistics.p99FrameTime.toFixed(2)}ms
                </div>
                
                <div className="text-xs text-gray-400">
                  Peak Memory: {statistics.peakMemoryUsage.toFixed(1)}MB
                </div>
                
                <div className="text-xs text-gray-400">
                  Total Long Tasks: {statistics.totalLongTasks}
                </div>
                
                <div className="text-xs text-gray-400">
                  Total Animation Drops: {statistics.totalAnimationDrops}
                </div>
              </div>
            )}

            {selectedTab === 'recommendations' && (
              <div className="space-y-2">
                {recommendations.length > 0 ? (
                  recommendations.map(recommendation => (
                    <Recommendation
                      key={recommendation.id}
                      recommendation={recommendation}
                    />
                  ))
                ) : (
                  <div className="text-xs text-gray-400 text-center py-4">
                    No recommendations available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          {showControls && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-600">
              <div className="flex space-x-1">
                <button
                  onClick={() => onExport?.('csv')}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                >
                  CSV
                </button>
                
                <button
                  onClick={() => onExport?.('json')}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                >
                  JSON
                </button>
                
                <button
                  onClick={onClear}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
              
              <div className="text-xs text-gray-400">
                Score: {performanceScore}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Compact HUD component
 */
export interface CompactMapPerformanceProfilerHUDProps {
  metrics: PerformanceMetrics;
  config?: Partial<MapPerformanceProfilerConfig['hud']>;
  onToggle?: (visible: boolean) => void;
  visible?: boolean;
}

export const CompactMapPerformanceProfilerHUD: React.FC<CompactMapPerformanceProfilerHUDProps> = ({
  metrics,
  config: userConfig,
  onToggle,
  visible = true,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.hud,
    ...userConfig,
  }), [userConfig]);

  const performanceScore = useMemo(() => {
    return calculatePerformanceScore(metrics);
  }, [metrics]);

  if (!visible) {
    return null;
  }

  const getPositionClasses = (): string => {
    switch (config.position) {
      case 'top-left': return 'top-0 left-0';
      case 'top-right': return 'top-0 right-0';
      case 'bottom-left': return 'bottom-0 left-0';
      case 'bottom-right': return 'bottom-0 right-0';
      case 'center': return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      default: return 'top-0 right-0';
    }
  };

  return (
    <div
      className={`fixed ${getPositionClasses()} p-2 rounded`}
      style={{
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
        borderWidth: config.borderWidth,
        borderRadius: config.borderRadius,
        opacity: config.opacity,
        zIndex: 1000,
      }}
    >
      <div className="flex items-center space-x-2">
        <PerformanceScore score={performanceScore} size="small" />
        <div className="text-xs text-white">
          {formatPerformanceValue(PerformanceMetricType.FPS, metrics.fps)}
        </div>
        <button
          onClick={() => onToggle?.(false)}
          className="text-gray-400 hover:text-white transition-colors p-1"
          title="Close"
        >
          <span className="text-xs">×</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Floating HUD component
 */
export interface FloatingMapPerformanceProfilerHUDProps {
  metrics: PerformanceMetrics;
  statistics: PerformanceStatistics;
  recommendations: PerformanceRecommendation[];
  config?: Partial<MapPerformanceProfilerConfig['hud']>;
  onToggle?: (visible: boolean) => void;
  onExport?: (format: 'csv' | 'json') => void;
  onClear?: () => void;
  visible?: boolean;
}

export const FloatingMapPerformanceProfilerHUD: React.FC<FloatingMapPerformanceProfilerHUDProps> = ({
  metrics,
  statistics,
  recommendations,
  config: userConfig,
  onToggle,
  onExport,
  onClear,
  visible = true,
}) => {
  const config = useMemo(() => ({
    ...DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.hud,
    ...userConfig,
  }), [userConfig]);

  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    });
  }, [position]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 1000,
      }}
      onMouseDown={handleMouseDown}
    >
      <MapPerformanceProfilerHUD
        metrics={metrics}
        statistics={statistics}
        recommendations={recommendations}
        config={config}
        onToggle={onToggle}
        onExport={onExport}
        onClear={onClear}
        visible={visible}
        compact={false}
      />
    </div>
  );
};
