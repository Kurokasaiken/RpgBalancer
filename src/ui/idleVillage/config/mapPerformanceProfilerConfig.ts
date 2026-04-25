/**
 * Map Performance Profiler Configuration - NP-024
 * 
 * Configuration schema and types for the Idle Village Map Performance Profiler.
 * Defines performance metrics, visualization settings, and export configurations.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';

const diagnostics = createSandboxDiagnostics('MapPerformanceProfilerConfig', 'config');

/**
 * Performance metric types
 */
export enum PerformanceMetricType {
  FPS = 'fps',
  FRAME_TIME = 'frame_time',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  RENDER_TIME = 'render_time',
  SCRIPT_TIME = 'script_time',
  PAINT_TIME = 'paint_time',
  LAYOUT_SHIFT = 'layout_shift',
  LONG_TASKS = 'long_tasks',
  INTERACTION_DELAY = 'interaction_delay',
  NETWORK_REQUESTS = 'network_requests',
  ANIMATION_FRAME_DROPS = 'animation_frame_drops',
  JANK = 'jank',
}

/**
 * Performance severity levels
 */
export enum PerformanceSeverity {
  GOOD = 'good',
  WARNING = 'warning',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

/**
 * Performance threshold configuration
 */
export interface PerformanceThreshold {
  metric: PerformanceMetricType;
  severity: PerformanceSeverity;
  min: number;
  max: number;
  optimal: number;
  description: string;
}

/**
 * Performance metrics data point
 */
export interface PerformanceMetrics {
  timestamp: number;
  fps: number;
  frameTime: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  scriptTime: number;
  paintTime: number;
  layoutShift: number;
  longTasks: number;
  interactionDelay: number;
  networkRequests: number;
  animationFrameDrops: number;
  junk: number;
  duration: number;
  totalDuration: number;
  selfTime: number;
}

/**
 * Frame performance entry
 */
export interface FramePerformanceEntry {
  frameNumber: number;
  timestamp: number;
  duration: number;
  startTime: number;
  endTime: number;
  selfTime: number;
  metrics: PerformanceMetrics;
  severity: PerformanceSeverity;
  recommendations: string[];
}

/**
 * Performance statistics
 */
export interface PerformanceStatistics {
  totalFrames: number;
  averageFps: number;
  averageFrameTime: number;
  maxFrameTime: number;
  minFrameTime: number;
  p95FrameTime: number;
  p99FrameTime: number;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  averageCpuUsage: number;
  totalJank: number;
  totalLongTasks: number;
  totalAnimationDrops: number;
  sessionDuration: number;
  recommendations: string[];
}

/**
 * Performance recommendation
 */
export interface PerformanceRecommendation {
  id: string;
  type: PerformanceMetricType;
  severity: PerformanceSeverity;
  title: string;
  description: string;
  suggestion: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  applied: boolean;
}

/**
 * Visualization configuration
 */
export interface VisualizationConfig {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'floating';
  opacity: number;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  fontSize: number;
  fontFamily: string;
  padding: number;
  margin: number;
  maxWidth: number;
  maxHeight: number;
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  showThresholds: boolean;
  showRecommendations: boolean;
  animationDuration: number;
  updateInterval: number;
}

/**
 * HUD overlay configuration
 */
export interface HUDConfig {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  margin: number;
  opacity: number;
  showOnStartup: boolean;
  toggleKey: string;
  autoHide: boolean;
  autoHideDelay: number;
  compactMode: boolean;
  showTimestamp: boolean;
  showRecommendations: boolean;
  showControls: boolean;
}

/**
 * Export configuration
 */
export interface ExportConfig {
  enabled: boolean;
  format: 'csv' | 'json' | 'xlsx';
  filename: string;
  includeHeaders: boolean;
  includeRecommendations: boolean;
  includeTimestamps: boolean;
  maxRecords: number;
  autoExport: boolean;
  autoExportInterval: number;
  compression: boolean;
  dateFormat: string;
  timeFormat: string;
  decimalPlaces: number;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enabled: boolean;
  sampleRate: number;
  bufferSize: number;
  maxBufferAge: number;
  autoStart: boolean;
  stopOnCritical: boolean;
  alertOnThreshold: boolean;
  alertThresholds: Record<PerformanceMetricType, number>;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    desktop: boolean;
  };
}

/**
 * Analysis configuration
 */
export interface AnalysisConfig {
  enabled: boolean;
  realTime: boolean;
  batchAnalysis: boolean;
  analysisInterval: number;
  lookbackWindow: number;
  smoothingWindow: number;
  trendDetection: boolean;
  anomalyDetection: boolean;
  baselineCalculation: 'average' | 'median' | 'percentile';
  percentileThreshold: number;
  correlationAnalysis: boolean;
  patternRecognition: boolean;
}

/**
 * Performance profiler configuration
 */
export interface MapPerformanceProfilerConfig {
  // Core settings
  enabled: boolean;
  autoStart: boolean;
  realTime: boolean;
  
  // Monitoring
  monitoring: MonitoringConfig;
  
  // Visualization
  visualization: VisualizationConfig;
  
  // HUD overlay
  hud: HUDConfig;
  
  // Export
  export: ExportConfig;
  
  // Analysis
  analysis: AnalysisConfig;
  
  // Performance thresholds
  thresholds: PerformanceThreshold[];
  
  // Recommendations
  recommendations: PerformanceRecommendation[];
  
  // Debugging
  debug: {
    enabled: boolean;
    showRawData: boolean;
    showMetrics: boolean;
    showStatistics: boolean;
    logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
    consoleOutput: boolean;
    fileOutput: boolean;
    maxLogSize: number;
  };
}

/**
 * Default performance thresholds
 */
export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThreshold[] = [
  // FPS thresholds
  {
    metric: PerformanceMetricType.FPS,
    severity: PerformanceSeverity.CRITICAL,
    min: 0,
    max: 30,
    optimal: 60,
    description: 'Frames per second - Critical if below 30, Optimal at 60+',
  },
  {
    metric: PerformanceMetricType.FPS,
    severity: PerformanceSeverity.WARNING,
    min: 30,
    max: 45,
    optimal: 60,
    description: 'Frames per second - Warning if between 30-45, Optimal at 60+',
  },
  {
    metric: PerformanceMetricType.FPS,
    severity: PerformanceSeverity.GOOD,
    min: 45,
    max: 60,
    optimal: 60,
    description: 'Frames per second - Good if 45-60, Optimal at 60+',
  },
  
  // Frame time thresholds (in milliseconds)
  {
    metric: PerformanceMetricType.FRAME_TIME,
    severity: PerformanceSeverity.CRITICAL,
    min: 100,
    max: 16.67,
    optimal: 16.67,
    description: 'Frame time - Critical if above 100ms (10fps), Optimal at 16.67ms (60fps)',
  },
  {
    metric: PerformanceMetricType.FRAME_TIME,
    severity: PerformanceSeverity.WARNING,
    min: 16.67,
    max: 33.33,
    optimal: 16.67,
    description: 'Frame time - Warning if 16.67-33.33ms (30-60fps), Optimal at 16.67ms (60fps)',
  },
  {
    metric: PerformanceMetricType.FRAME_TIME,
    severity: PerformanceSeverity.GOOD,
    min: 33.33,
    max: 50,
    optimal: 16.67,
    description: 'Frame time - Good if 33.33-50ms (20-30fps), Optimal at 16.67ms (60fps)',
  },
  
  // Memory usage thresholds (in MB)
  {
    metric: PerformanceMetricType.MEMORY_USAGE,
    severity: PerformanceSeverity.CRITICAL,
    min: 500,
    max: 1000,
    optimal: 200,
    description: 'Memory usage - Critical if above 1000MB, Optimal below 200MB',
  },
  {
    metric: PerformanceMetricType.MEMORY_USAGE,
    severity: PerformanceSeverity.WARNING,
    min: 200,
    max: 500,
    optimal: 200,
    description: 'Memory usage - Warning if 200-500MB, Optimal below 200MB',
  },
  {
    metric: PerformanceMetricType.MEMORY_USAGE,
    severity: PerformanceSeverity.GOOD,
    min: 0,
    max: 200,
    optimal: 100,
    description: 'Memory usage - Good if below 200MB, Optimal below 100MB',
  },
  
  // CPU usage thresholds (percentage)
  {
    metric: PerformanceMetricType.CPU_USAGE,
    severity: PerformanceSeverity.CRITICAL,
    min: 80,
    max: 100,
    optimal: 50,
    description: 'CPU usage - Critical if above 80%, Optimal below 50%',
  },
  {
    metric: PerformanceMetricType.CPU_USAGE,
    severity: PerformanceSeverity.WARNING,
    min: 50,
    max: 80,
    optimal: 50,
    description: 'CPU usage - Warning if 50-80%, Optimal below 50%',
  },
  {
    metric: PerformanceMetricType.CPU_USAGE,
    severity: PerformanceSeverity.GOOD,
    min: 0,
    max: 50,
    optimal: 25,
    description: 'CPU usage - Good if below 50%, Optimal below 25%',
  },
  
  // Render time thresholds (in milliseconds)
  {
    metric: PerformanceMetricType.RENDER_TIME,
    severity: PerformanceSeverity.CRITICAL,
    min: 50,
    max: 100,
    optimal: 16.67,
    description: 'Render time - Critical if above 100ms, Optimal at 16.67ms',
  },
  {
    metric: PerformanceMetricType.RENDER_TIME,
    severity: PerformanceSeverity.WARNING,
    min: 16.67,
    max: 33.33,
    optimal: 16.67,
    description: 'Render time - Warning if 16.67-33.33ms, Optimal at 16.67ms',
  },
  {
    metric: PerformanceMetricType.RENDER_TIME,
    severity: PerformanceSeverity.GOOD,
    min: 0,
    max: 16.67,
    optimal: 8,
    description: 'Render time - Good if below 16.67ms, Optimal below 8ms',
  },
  
  // Script time thresholds (in milliseconds)
  {
    metric: PerformanceMetricType.SCRIPT_TIME,
    severity: PerformanceSeverity.CRITICAL,
    min: 50,
    max: 100,
    optimal: 16.67,
    description: 'Script time - Critical if above 100ms, Optimal at 16.67ms',
  },
  {
    metric: PerformanceMetricType.SCRIPT_TIME,
    severity: PerformanceSeverity.WARNING,
    min: 16.67,
    max: 33.33,
    optimal: 16.67,
    description: 'Script time - Warning if 16.67-33.33ms, Optimal at 16.67ms',
  },
  {
    metric: PerformanceMetricType.SCRIPT_TIME,
    severity: PerformanceSeverity.GOOD,
    min: 0,
    max: 16.67,
    optimal: 8,
    description: 'Script time - Good if below 16.67ms, Optimal at 8ms',
  },
  
  // Paint time thresholds (in milliseconds)
  {
    metric: PerformanceMetricType.PAINT_TIME,
    severity: PerformanceSeverity.CRITICAL,
    min: 50,
    max: 100,
    optimal: 16.67,
    description: 'Paint time - Critical if above 100ms, Optimal at 16.67ms',
  },
  {
    metric: PerformanceType.PAINT_TIME,
    severity: PerformanceSeverity.WARNING,
    min: 16.67,
    max: 33.33,
    optimal: 16.67,
    description: 'Paint time - Warning if 16.67-33.33ms, Optimal at 16.67ms',
  },
  {
    metric: PerformanceType.PAINT_TIME,
    severity: PerformanceSeverity.GOOD,
    min: 0,
    max: 16.67,
    optimal: 8,
    description: 'Paint time - Good if below 16.67ms, Optimal at 8ms',
  },
  
  // Layout shift thresholds
  {
    metric: PerformanceMetricType.LAYOUT_SHIFT,
    severity: PerformanceSeverity.CRITICAL,
    min: 5,
    max: 10,
    optimal: 0,
    description: 'Layout shifts - Critical if above 5, Optimal at 0',
  },
  {
    metric: PerformanceMetricType.LAYOUT_SHIFT,
    severity: PerformanceSeverity.WARNING,
    min: 1,
    max: 5,
    optimal: 0,
    description: 'Layout shifts - Warning if 1-5, Optimal at 0',
  },
  {
    metric: PerformanceMetricType.LAYOUT_SHIFT,
    severity: PerformanceSeverity.GOOD,
    min: 0,
    max: 1,
    optimal: 0,
    description: 'Layout shifts - Good if 0-1, Optimal at 0',
  },
  
  // Long tasks thresholds (in milliseconds)
  {
    metric: PerformanceMetricType.LONG_TASKS,
    severity: PerformanceSeverity.CRITICAL,
    min: 100,
    max: 200,
    optimal: 50,
    description: 'Long tasks - Critical if above 200ms, Optimal below 50ms',
  },
  {
    metric: PerformanceMetricType.LONG_TASKS,
    severity: PerformanceSeverity.WARNING,
    min: 50,
    max: 100,
    optimal: 50,
    description: 'Long tasks - Warning if 50-100ms, Optimal below 50ms',
  },
  {
    metric: PerformanceMetricType.LONG_TASKS,
    severity: PerformanceSeverity.GOOD,
    min: 0,
    max: 50,
    optimal: 16.67,
    description: 'Long tasks - Good if below 50ms, Optimal below 16.67ms',
  },
  
  // Interaction delay thresholds (in milliseconds)
  {
    metric: PerformanceMetricType.INTERACTION_DELAY,
    severity: PerformanceSeverity.CRITICAL,
    min: 200,
    max: 500,
    optimal: 100,
    description: 'Interaction delay - Critical if above 500ms, Optimal below 100ms',
  },
  {
    metric: PerformanceMetricType.INTERACTION_DELAY,
    severity: PerformanceSeverity.WARNING,
    min: 100,
    max: 200,
    optimal: 100,
    description: 'Interaction delay - Warning if 100-200ms, Optimal below 100ms',
  },
  {
    metric: PerformanceMetricType.INTERACTION_DELAY,
    severity: PerformanceSeverity.GOOD,
    min: 0,
    max: 100,
    optimal: 50,
    description: 'Interaction delay - Good if below 100ms, Optimal below 50ms',
  },
  
  // Network requests thresholds
  {
    metric: PerformanceMetricType.NETWORK_REQUESTS,
    severity: PerformanceSeverity.CRITICAL,
    min: 50,
    max: 100,
    optimal: 10,
    description: 'Network requests - Critical if above 100, Optimal below 10',
  },
  {
    metric: PerformanceMetricType.NETWORK_REQUESTS,
    severity: PerformanceSeverity.WARNING,
    min: 10,
    max: 50,
    optimal: 10,
    description: 'Network requests - Warning if 10-50, Optimal below 10',
  },
  {
    metric: PerformanceMetricType.NETWORK_REQUESTS,
    severity: PerformanceSeverity.GOOD,
    min: 0,
    max: 10,
    optimal: 5,
    description: 'Network requests - Good if below 10, Optimal below 5',
  },
  
  // Animation frame drops thresholds
  {
    metric: PerformanceMetricType.ANIMATION_FRAME_DROPS,
    severity: PerformanceSeverity.CRITICAL,
    min: 10,
    max: 20,
    optimal: 0,
    description: 'Animation frame drops - Critical if above 20, Optimal at 0',
  },
  {
    metric: PerformanceMetricType.ANIMATION_FRAME_DROPS,
    severity: PerformanceSeverity.WARNING,
    min: 5,
    max: 10,
    optimal: 0,
    description: 'Animation frame drops - Warning if 5-10, Optimal at 0',
  },
  {
    metric: PerformanceMetricType.ANIMATION_FRAME_DROPS,
    severity: PerformanceSeverity.GOOD,
    min: 0,
    max: 5,
    optimal: 0,
    description: 'Animation frame drops - Good if 0-5, Optimal at 0',
  },
  
  // Junk thresholds (percentage)
  {
    metric: PerformanceMetricType.JANK,
    severity: PerformanceSeverity.CRITICAL,
    min: 50,
    max: 100,
    optimal: 10,
    description: 'Junk - Critical if above 100%, Optimal below 10%',
  },
  {
    metric: PerformanceMetricType.JUNK,
    severity: PerformanceSeverity.WARNING,
    min: 10,
    max: 50,
    optimal: 10,
    description: 'Junk - Warning if 10-50%, Optimal below 10%',
  },
  {
    metric: PerformanceMetricType.JUNK,
    severity: PerformanceSeverity.GOOD,
    min: 0,
    max: 10,
    optimal: 0,
    description: 'Junk - Good if below 10%, Optimal at 0%',
  },
];

/**
 * Default configuration
 */
export const DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG: MapPerformanceProfilerConfig = {
  enabled: true,
  autoStart: true,
  realTime: true,
  
  monitoring: {
    enabled: true,
    sampleRate: 60, // 60fps target
    bufferSize: 1000,
    maxBufferAge: 60000, // 1 minute
    autoStart: true,
    stopOnCritical: false,
    alertOnThreshold: true,
    alertThresholds: {
      [PerformanceMetricType.FPS]: 30,
      [PerformanceMetricType.FRAME_TIME]: 100,
      [PerformanceMetricType.MEMORY_USAGE]: 500,
      [PerformanceMetricType.CPU_USAGE]: 80,
    },
    notifications: {
      enabled: false,
      sound: false,
      vibration: false,
      desktop: true,
    },
  },
  
  visualization: {
    enabled: true,
    position: 'top-right',
    opacity: 0.9,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    textColor: '#ffffff',
    borderColor: '#333333',
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'monospace',
    padding: 8,
    margin: 10,
    maxWidth: 300,
    maxHeight: 200,
    showGrid: true,
    showAxes: true,
    showLabels: true,
    showThresholds: true,
    showRecommendations: true,
    animationDuration: 300,
    updateInterval: 100,
  },
  
  hud: {
    enabled: true,
    position: 'top-right',
    width: 300,
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: '#333333',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 10,
    opacity: 0.9,
    showOnStartup: true,
    toggleKey: 'F9',
    autoHide: false,
    autoHideDelay: 5000,
    compactMode: false,
    showTimestamp: true,
    showRecommendations: true,
    showControls: true,
  },
  
  export: {
    enabled: true,
    format: 'csv',
    filename: 'performance-metrics',
    includeHeaders: true,
    includeRecommendations: true,
    includeTimestamps: true,
    maxRecords: 10000,
    autoExport: false,
    autoExportInterval: 300000, // 5 minutes
    compression: false,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    decimalPlaces: 2,
  },
  
  analysis: {
    enabled: true,
    realTime: true,
    batchAnalysis: true,
    analysisInterval: 1000,
    lookbackWindow: 60000, // 1 minute
    smoothingWindow: 10,
    trendDetection: true,
    anomalyDetection: true,
    baselineCalculation: 'average',
    percentileThreshold: 95,
    correlationAnalysis: true,
    patternRecognition: true,
  },
  
  thresholds: DEFAULT_PERFORMANCE_THRESHOLDS,
  
  recommendations: [
    {
      id: 'fps-low',
      type: PerformanceMetricType.FPS,
      severity: PerformanceSeverity.WARNING,
      title: 'Low FPS Detected',
      description: 'Frame rate is below optimal. Consider reducing visual complexity or enabling performance optimizations.',
      suggestion: 'Enable hardware acceleration, reduce particle effects, or lower render resolution.',
      impact: 'medium',
      automated: false,
      applied: false,
    },
    {
      id: 'memory-high',
      type: PerformanceMetricType.MEMORY_USAGE,
      severity: PerformanceSeverity.WARNING,
      title: 'High Memory Usage',
      textureDescription: 'Memory usage is approaching limits. Consider optimizing data structures and clearing unused resources.',
      suggestion: 'Clear unused textures, optimize data structures, or increase garbage collection frequency.',
      impact: 'medium',
      automated: false,
      applied: false,
    },
    {
      'id: 'long-tasks',
      type: PerformanceMetricType.LONG_TASKS,
      severity: PerformanceSeverity.WARNING,
      title: 'Long Tasks Detected',
      description: 'JavaScript tasks are blocking the main thread. Consider using Web Workers or breaking up large computations.',
      suggestion: 'Use Web Workers for heavy computations, break up large loops, or use requestIdleCallback.',
      impact: 'high',
      automated: false,
      applied: false,
    },
    {
      'layout-shifts',
      type: PerformanceMetricType.LAYOUT_SHIFT,
      severity: PerformanceSeverity.WARNING,
      title: 'Layout Shifts Detected',
      description: 'Layout shifts are causing visual jank. Consider optimizing CSS and DOM operations.',
      suggestion: 'Avoid forced synchronous layouts, use CSS Grid or Flexbox, batch DOM operations.',
      impact: 'medium',
      automated: false,
      applied: false,
    },
  ],
  
  debug: {
    enabled: false,
    showRawData: false,
    showMetrics: true,
    showStatistics: true,
    logLevel: 'error',
    consoleOutput: true,
    fileOutput: false,
    maxLogSize: 1000,
  },
};

/**
 * Utility functions
 */

/**
 * Generate unique ID for performance entries
 */
export function generatePerformanceId(): string {
  return `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get performance threshold for a metric
 */
export function getPerformanceThreshold(
  metric: PerformanceMetricType,
  value: number
): PerformanceThreshold | null {
  const thresholds = DEFAULT_PERFORMANCE_THRESHOLDS.filter(t => t.metric === metric);
  if (thresholds.length === 0) return null;
  
  // Find the threshold that contains the value
  for (const threshold of thresholds) {
    if (value >= threshold.min && value <= threshold.max) {
      return threshold;
    }
  }
  
  return null;
}

/**
 * Get performance severity for a metric value
 */
export function getPerformanceSeverity(
  metric: PerformanceMetricType,
  value: number
): PerformanceSeverity {
  const threshold = getPerformanceThreshold(metric, value);
  return threshold ? threshold.severity : PerformanceSeverity.UNKNOWN;
}

/**
 * Check if a value is within optimal range
 */
export function isOptimal(
  metric: PerformanceMetricType,
  value: number
): boolean {
  const threshold = getPerformanceThreshold(metric, value);
  return threshold ? value <= threshold.optimal : false;
}

/**
 * Check if a value is within acceptable range
 */
export function isAcceptable(
  metric: PerformanceMetricType,
  value: number
): boolean {
  const threshold = getPerformanceThreshold(metric, value);
  return threshold ? value >= threshold.min && value <= threshold.max : false;
}

/**
 * Check if a value requires immediate attention
 */
export function requiresAttention(
  metric: PerformanceMetricType,
  value: number
): boolean {
  const threshold = getPerformanceThreshold(metric, value);
  return threshold ? value >= threshold.max : false;
}

/**
 * Format performance value for display
 */
export function formatPerformanceValue(
  metric: PerformanceMetricType,
  value: number,
  precision: number = 2
): string {
  switch (metric) {
    case PerformanceMetricType.FPS:
      return value.toFixed(0);
    case PerformanceMetricType.FRAME_TIME:
      return `${value.toFixed(precision)}ms`;
    case PerformanceMetricType.MEMORY_USAGE:
      return `${( value / 1024 ).toFixed(precision)}MB`;
    case PerformanceMetricType.CPU_USAGE:
      return `${value.toFixed(precision)}%`;
    case PerformanceMetricType.RENDER_TIME:
      return `${value.toFixed(precision)}ms`;
    case PerformanceMetricType.SCRIPT_TIME:
      return `${value.toFixed(precision)}ms`;
    case PerformanceType.PAINT_TIME:
      return `${value.toFixed(precision)}ms`;
    case PerformanceMetricType.LAYOUT_SHIFT:
      return value.toString();
    case PerformanceMetricType.LONG_TASKS:
      return `${value}ms`;
    case PerformanceMetricType.INTERACTION_DELAY:
      return `${value}ms`;
    case PerformanceMetricType.NETWORK_REQUESTS:
      return value.toString();
    case PerformanceMetricType.ANIMATION_FRAME_DROPS:
      return `${value} drops`;
    case PerformanceMetricType.JUNK:
      return `${value}%`;
    default:
      return value.toString();
  }
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Calculate performance score (0-100)
 */
export function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100;
  
  // FPS scoring (40% weight)
  if (metrics.fps >= 60) {
    score += 0;
  } else if (metrics.fps >= 45) {
    score -= 10;
  } else if (metrics.fps >= 30) {
    score -= 30;
  } else {
    score -= 50;
  }
  
  // Frame time scoring (30% weight)
  if (metrics.frameTime <= 16.67) {
    score += 0;
  } else if (metrics.frameTime <= 33.33) {
    score -= 10;
  } else if (metrics.frameTime <= 50) {
    score -= 20;
  } else {
    score -= 40;
  }
  
  // Memory usage scoring (20% weight)
  if (metrics.memoryUsage <= 100) {
    score += 0;
  } else if (metrics.memoryUsage <= 200) {
    score -= 10;
  } else if (metrics.memoryUsage <= 500) {
    score -= 20;
  } else {
    score -= 40;
  }
  
  // CPU usage scoring (10% weight)
  if (metrics.cpuUsage <= 25) {
    score += 0;
  } else if (metrics.cpuUsage <= 50) {
    score -= 10;
  } else if (metrics.cpuUsage <= 80) {
    score -= 20;
  } else {
    score -= 40;
  }
  
  return Math.max(0, score);
}

/**
 * Generate performance recommendations
 */
export function generateRecommendations(
  metrics: PerformanceMetrics,
  thresholds: PerformanceThreshold[] = DEFAULT_PERFORMANCE_THRESHOLDS
): PerformanceRecommendation[] {
  const recommendations: PerformanceRecommendation[] = [];
  
  thresholds.forEach(threshold => {
    const value = getMetricValue(metrics, threshold.metric);
    if (value !== null && requiresAttention(threshold.metric, value)) {
      const recommendation = DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG.recommendations.find(
        r => r.type === threshold.metric
      );
      
      if (recommendation) {
        recommendations.push({
          ...recommendation,
          applied: false,
        });
      }
    }
  });
  
  return recommendations;
}

/**
 * Get metric value from metrics object
 */
function getMetricValue(metrics: PerformanceMetrics, metric: PerformanceMetricType): number {
  switch (metric) {
    case PerformanceMetricType.FPS: return metrics.fps;
    case PerformanceMetricType.FRAME_TIME: return metrics.frameTime;
    case PerformanceMetricType.MEMORY_USAGE: return metrics.memoryUsage;
    case PerformanceMetricType.CPU_USAGE: return metrics.cpuUsage;
    case PerformanceType.RENDER_TIME: return metrics.renderTime;
    case PerformanceMetricType.SCRIPT_TIME: return metrics.scriptTime;
    case PerformanceType.PAINT_TIME: return metrics.paintTime;
    case PerformanceMetricType.LAYOUT_SHIFT: return metrics.layoutShift;
    case PerformanceMetricType.LONG_TASKS: return metrics.longTasks;
    case PerformanceMetricType.INTERACTION_DELAY: return metrics.interactionDelay;
    case PerformanceMetricType.NETWORK_REQUESTS: return metrics.networkRequests;
    case PerformanceMetricType.ANIMATION_FRAME_DROPS: return metrics.animationFrameDrops;
    case PerformanceMetricType.JUNK: return metrics.junk;
    default: return 0;
  }
}

/**
 * Validate profiler configuration
 */
export function validateProfilerConfig(
  config: Partial<MapPerformanceProfilerConfig>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (config.visualization) {
    const viz = config.visualization;
    if (viz.opacity < 0 || viz.opacity > 1) {
      errors.push('Visualization opacity must be between 0 and 1');
    }
    if (viz.fontSize < 8 || viz.fontSize > 24) {
      errors.push('Font size must be between 8 and 24');
    }
    if (viz.maxWidth < 100 || viz.maxWidth > 1000) {
      errors.push('Max width must be between 100 and 1000');
    }
    if (viz.maxHeight < 50 || viz.maxHeight > 500) {
      errors.push('Max height must be between 50 and 500');
    }
  }
  
  if (config.hud) {
    const hud = config.hud;
    if (hud.width < 200 || hud.width > 600) {
      errors.push('HUD width must be between 200 and 600');
    }
    if (hud.height < 100 || hud.height > 400) {
      errors.push('HUD height must be between 100 and 400');
    }
    if (hud.opacity < 0 || hud.opacity > 1) {
      errors.push('HUD opacity must be between 0 and 1');
    }
  }
  
  if (config.export) {
    const exp = config.export;
    if (exp.maxRecords < 100 || exp.maxRecords > 100000) {
      errors.push('Max records must be between 100 and 100000');
    }
    if (exp.decimalPlaces < 0 || exp.decimalPlaces > 6) {
      errors.push('Decimal places must be between 0 and 6');
    }
  }
  
  if (config.monitoring) {
    const mon = config.monitoring;
    if (mon.sampleRate < 1 || mon.sampleRate > 120) {
      errors.push('Sample rate must be between 1 and 120');
    }
    if (mon.bufferSize < 100 || mon.bufferSize > 10000) {
      errors.push('Buffer size must be between 100 and 10000');
    }
    if (mon.maxBufferAge < 1000 || mon.maxBufferAge > 300000) {
      errors.push('Max buffer age must be between 1000 and 300000');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
