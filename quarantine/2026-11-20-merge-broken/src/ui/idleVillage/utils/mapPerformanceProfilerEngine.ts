/**
 * Map Performance Profiler Engine - NP-024
 * 
 * Performance monitoring engine with PerformanceObserver integration.
 * Provides real-time frame monitoring, metrics collection, and analysis
 * for the Idle Village map performance profiler.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  type MapPerformanceProfilerConfig,
  type PerformanceMetrics,
  type FramePerformanceEntry,
  type PerformanceStatistics,
  type PerformanceRecommendation,
  PerformanceMetricType,
  PerformanceSeverity,
  DEFAULT_MAP_PERFORMANCE_PROFILER_CONFIG,
  generatePerformanceId,
  getPerformanceThreshold,
  getPerformanceSeverity,
  isOptimal,
  isAcceptable,
  requiresAttention,
  formatPerformanceValue,
  formatTimestamp,
  calculatePerformanceScore,
  generateRecommendations,
  getMetricValue,
  validateProfilerConfig,
} from '../config/mapPerformanceProfilerConfig';

const diagnostics = createSandboxDiagnostics('MapPerformanceProfilerEngine', 'engine');

/**
 * Performance profiler events
 */
export interface ProfilerEngineEvents {
  /** Fired when metrics are updated */
  'metrics-updated': { metrics: PerformanceMetrics; statistics: PerformanceStatistics };
  /** Fired when frame is analyzed */
  'frame-analyzed': { entry: FramePerformanceEntry };
  /** Fired when threshold is exceeded */
  'threshold-exceeded': { metric: PerformanceMetricType; value: number; severity: PerformanceSeverity };
  /** Fired when recommendations are generated */
  'recommendations-generated': { recommendations: PerformanceRecommendation[] };
  /** Fired when analysis is completed */
  'analysis-completed': { statistics: PerformanceStatistics };
  /** Fired when error occurs */
  'error': { error: Error; context: string };
}

/**
 * Frame analysis result
 */
export interface FrameAnalysisResult {
  entry: FramePerformanceEntry;
  metrics: PerformanceMetrics;
  severity: PerformanceSeverity;
  recommendations: PerformanceRecommendation[];
  timestamp: number;
}

/**
 * Performance profiler engine
 */
export class MapPerformanceProfilerEngine {
  private config: MapPerformanceProfilerConfig;
  private performanceObserver: PerformanceObserver | null;
  private isObserving: boolean = false;
  private frameBuffer: FramePerformanceEntry[] = [];
  private metricsHistory: PerformanceMetrics[] = [];
  private statistics: PerformanceStatistics;
  private eventListeners: Map<keyof ProfilerEngineEvents, Array<(data: any) => void>> = new Map();
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private startTime: number = 0;
  private totalDuration: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;
  private analysisInterval: NodeJS.Timeout | null;
  private lastAnalysisTime: number = 0;

  constructor(config?: Partial<MapPerformanceProfilerConfig>) {
    this.config = { ...DEFAULT_MAP_PERFORMANCE_CONFIG, ...config };
    this.statistics = {
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
      totalJunk: 0,
      totalLongTasks: 0,
      totalAnimationDrops: 0,
      sessionDuration: 0,
      recommendations: [],
    };
    
    this.initializeEventListeners();
    
    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    const events: (keyof ProfilerEngineEvents)[] = [
      'metrics-updated',
      'frame-analyzed',
      'threshold-exceeded',
      'recommendations-generated',
      'analysis-completed',
      'error',
    ];
    
    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  /**
   * Add event listener
   */
  public addEventListener<K extends keyof ProfilerEngineEvents>(
    event: K,
    listener: (data: ProfilerEngineEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(listener);
    this.eventListeners.set(event, listeners);
  }

  /**
   * Remove event listener
   */
  public removeEventListener<K extends keyof ProfilerEngineEvents>(
    event: K,
    listener: (data: ProfilerEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends keyof ProfilerEngineEvents>(event: K, data: ProfilerEvents[K]): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        diagnostics.error('Error in event listener', { event, error });
      }
    });
  }

  /**
   * Start performance monitoring
   */
  public start(): void {
    if (this.isObserving) {
      return;
    }

    try {
      // Check for PerformanceObserver support
      if (!window.PerformanceObserver) {
        throw new Error('PerformanceObserver is not supported in this browser');
      }

      // Create PerformanceObserver
      this.performanceObserver = new PerformanceObserver((entries) => {
        this.processPerformanceEntries(entries);
      });

      // Configure observer
      const observerConfig = {
        // Enable all available metrics
        buffered: true,
        duration: 0,
        sampleRate: this.config.monitoring.sampleRate,
      };

      // Start observing
      this.performanceObserver.observe(observerConfig);
      this.isObserving = true;
      this.startTime = performance.now();

      diagnostics.info('Performance profiler started', {
        sampleRate: this.config.monitoring.sampleRate,
        bufferSize: this.config.monitoring.bufferSize,
      });

      // Start update interval
      this.startUpdateInterval();

      // Start analysis interval
      if (this.config.analysis.enabled) {
        this.startAnalysisInterval();
      }

      this.emit('metrics-updated', {
        metrics: this.getCurrentMetrics(),
        statistics: this.statistics,
      });

    } catch (error) {
      diagnostics.error('Failed to start performance profiler', { error });
      this.emit('error', { error, context: 'start' });
      throw error;
    }
  }

  /**
   * Stop performance monitoring
   */
  public stop(): void {
    if (!this.isObserving) {
      return;
    }

    try {
      if (this.performanceObserver) {
        this.performanceObserver.disconnect();
        this.performanceObserver = null;
      }

      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      if (this.analysisInterval) {
        clearInterval(this.analysisInterval);
        this.analysisInterval = null;
      }

      this.isObserving = false;
      this.emit('metrics-updated', {
        metrics: this.getCurrentMetrics(),
        statistics: this.statistics,
      });

      diagnostics.info('Performance profiler stopped');

    } catch (error) {
      diagnostics.error('Failed to stop performance profiler', { error });
      this.emit('error', { error, context: 'stop' });
    }
  }

  /**
   * Start update interval
   */
  private startUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.updateStatistics();
    }, this.config.visualization.updateInterval);
  }

  /**
   * Start analysis interval
   */
  private startAnalysisInterval(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }

    this.analysisInterval = setInterval(() => {
      this.performAnalysis();
    }, this.config.analysis.analysisInterval);
  }

  /**
   * Process performance entries from PerformanceObserver
   */
  private processPerformanceEntries(entries: PerformanceObserverEntry[]): void {
    const now = performance.now();
    
    entries.forEach(entry => {
      const metrics = this.extractMetricsFromEntry(entry);
      
      // Add to frame buffer
      this.frameBuffer.push({
        frameNumber: this.frameCount++,
        timestamp: now,
        duration: entry.duration || 0,
        startTime: entry.startTime || now,
        endTime: entry.endTime || now,
        selfTime: entry.selfTime || 0,
        metrics,
        severity: getPerformanceSeverity(PerformanceMetricType.FPS, metrics.fps),
        recommendations: [],
      });

      // Update frame count
      this.frameCount++;
      this.lastFrameTime = entry.duration || 0;
      this.totalDuration += entry.duration || 0;

      // Maintain buffer size
      if (this.frameBuffer.length > this.config.monitoring.bufferSize) {
        this.frameBuffer.shift();
      }

      // Emit frame analysis
      const entry = this.frameBuffer[this.frameBuffer.length - 1];
      this.emit('frame-analyzed', { entry });
      
      // Check for threshold violations
      this.checkThresholds(entry);
    });

    // Update metrics and statistics
    this.updateStatistics();
  }

  /**
   * Extract metrics from PerformanceObserver entry
   */
  private extractMetricsFromEntry(entry: PerformanceEntry): PerformanceMetrics {
    const metrics: Partial<PerformanceMetrics> = {};
    
    // Extract timing metrics
    if (entry.duration) metrics.frameTime = entry.duration;
    if (entry.startTime) metrics.startTime = entry.startTime;
    if (entry.selfTime) metrics.selfTime = entry.selfTime;
    
    // Extract paint metrics
    if (entry.paintDuration) metrics.paintTime = entry.paintDuration;
    
    // Extract script metrics
    if (entry.processingStart && entry.processingEnd) {
      metrics.scriptTime = entry.processingEnd - entry.processingStart;
    }
    
    // Extract layout shift metrics
    if (entry.sources) {
      const layoutShifts = entry.sources.filter(source => 
        name === 'layout-shift' || name === 'layout-invalidation'
      );
      metrics.layoutShift = layoutShifts.length;
    }
    
    // Extract long tasks
    if (entry.processingStart && entry.processingEnd) {
      const longTasks = entry.measures?.filter(measure => 
        name.startsWith('long-task') && 
        measure.duration > this.config.monitoring.thresholds[PerformanceMetricType.LONG_TASKS].min
      );
      metrics.longTasks = longTasks.length;
    }
    
    // Extract animation frame drops
    if (entry.processingStart && entry.processingEnd) {
      const animationDrops = entry.measures?.filter(measure => 
        (name.startsWith('animation-frame') || name.startsWith('animation-')) &&
        measure.duration > this.config.monitoring.thresholds[PerformanceMetricType.ANIMATION_FRAME_DROPS].min
      );
      metrics.animationFrameDrops = animationDrops.length;
    }
    
    // Extract interaction delay
    if (entry.firstInputEvent && entry.firstPaintTime) {
      const interactionDelay = entry.firstPaintTime - entry.processingStart;
      metrics.interactionDelay = Math.max(0, interactionDelay);
    }
    
    // Extract network requests
    const networkRequests = entry.resources?.length || 0;
    metrics.networkRequests = networkRequests;
    
    // Extract CPU usage (approximation)
    const cpuUsage = this.estimateCpuUsage(entry);
    metrics.cpuUsage = cpuUsage;
    
    // Extract memory usage (approximation)
    const memoryUsage = this.estimateMemoryUsage(entry);
    metrics.memoryUsage = memoryUsage;
    
    // Calculate FPS
    if (entry.duration > 0) {
      metrics.fps = 1000 / entry.duration;
    }
    
    // Calculate junk (approximation)
    const junk = this.estimateJunk(entry);
    metrics.junk = junk;
    
    // Calculate duration
    metrics.duration = entry.duration || 0;
    
    // Calculate total duration
    metrics.totalDuration = this.totalDuration;
    
    return metrics as PerformanceMetrics;
  }

  /**
   * Estimate CPU usage from performance entry
   */
  private estimateCpuUsage(entry: PerformanceObserverEntry): number {
    // This is a rough estimation based on available data
    const processingTime = entry.processingEnd ? entry.processingEnd - (entry.processingStart || 0) : 0;
    const totalTime = entry.duration || 0;
    
    if (totalTime === 0) return 0;
    
    // Rough estimation based on processing time vs total time
    const cpuUsage = (processingTime / totalTime) * 100;
    return Math.min(100, cpuUsage);
  }

  /**
   * Estimate memory usage from performance entry
   */
  private estimateMemoryUsage(entry: PerformanceObserverEntry): number {
    // This is a rough estimation based on available data
    const memoryUsage = entry.transferSize || 0;
    const decodedSize = entry.encodedBodySize || 0;
    const totalSize = memoryUsage + decodedSize;
    
    // Convert to MB
    return totalSize / (1024 * 1024);
  }

  /**
   * Estimate junk percentage from performance entry
   */
  private estimateJunk(entry: PerformanceObserverEntry): number {
    // This is a rough estimation based on available data
    const totalTime = entry.duration || 1;
    const processingTime = entry.processingEnd ? entry.processingEnd - (entry.processingStart || 0) : 0;
    const scriptTime = entry.processingEnd ? entry.processingEnd - (entry.processingStart || 0) : 0;
    const paintTime = entry.paintDuration || 0;
    
    // Junk is time spent on main thread but not rendering
    const junkPercentage = ((totalTime - paintTime - scriptTime) / totalTime) * 100;
    return Math.min(100, junkPercentage);
  }

  /**
   * Check for threshold violations
   */
  private checkThresholds(entry: FramePerformanceEntry): void {
    Object.entries(entry.metrics).forEach(([metric, value]) => {
      const threshold = getPerformanceThreshold(metric as PerformanceMetricType, value);
      
      if (threshold && requiresAttention(metric, value)) {
        this.emit('threshold-exceeded', {
          metric,
          value,
          severity: threshold.severity,
        });

        // Stop on critical threshold if configured
        if (threshold.severity === PerformanceSeverity.CRITICAL && this.config.monitoring.stopOnCritical) {
          this.stop();
        }
      }
    });
  }

  /**
   * Update statistics
   */
  private updateStatistics(): void {
    if (this.frameBuffer.length === 0) {
      return;
    }

    const recentFrames = this.frameBuffer.slice(-100); // Last 100 frames
    const metrics = recentFrames.map(frame => frame.metrics);
    
    // Calculate basic statistics
    const totalFrames = this.frameCount;
    const averageFps = metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length;
    const averageFrameTime = metrics.reduce((sum, m) => sum + m.frameTime, 0) / metrics.length;
    const maxFrameTime = Math.max(...metrics.map(m => m.frameTime));
    const minFrameTime = Math.min(...metrics.map(m => m.frameTime));
    
    // Calculate percentiles
    const sortedFrameTimes = metrics.map(m => m.frameTime).sort((a, b) => a - b);
    const p95FrameTime = sortedFrameTimes[Math.floor(sortedFrameTimes.length * 0.95)];
    const p99FrameTime = sortedFrameTime[Math.floor(sortedFrameTimes.length * 0.99)];
    
    // Calculate averages
    const averageMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    const peakMemoryUsage = Math.max(...metrics.map(m => m.memoryUsage));
    const averageCpuUsage = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
    const totalJunk = metrics.reduce((sum, m) => sum + m.junk, 0) / metrics.length;
    const totalLongTasks = metrics.reduce((sum, m) => sum + m.longTasks, 0);
    const totalAnimationDrops = metrics.reduce((sum, m) => sum + m.animationFrameDrops, 0);
    
    // Update statistics
    this.statistics = {
      totalFrames,
      averageFps,
      averageFrameTime,
      maxFrameTime,
      minFrameTime,
      p95FrameTime,
      p99FrameTime,
      averageMemoryUsage,
      peakMemoryUsage,
      averageCpuUsage,
      totalJunk,
      totalLongTasks,
      totalAnimationDrops,
      sessionDuration: Date.now() - this.startTime,
      recommendations: [],
    };

    this.emit('metrics-updated', {
      metrics: this.getCurrentMetrics(),
      statistics: this.statistics,
    });
  }

  /**
   * Get current metrics
   */
  public getCurrentMetrics(): PerformanceMetrics {
    if (this.frameBuffer.length === 0) {
      return {
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
      };
    }

    return this.frameBuffer[this.frameBuffer.length - 1]?.metrics || this.getCurrentMetrics();
  }

  /**
   * Get frame buffer
   */
  public getFrameBuffer(): FramePerformanceEntry[] {
    return [...this.frameBuffer];
  }

  /**
   * Get metrics history
   */
  public getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Get performance statistics
   */
  public getStatistics(): PerformanceStatistics {
    return { ...this.statistics };
  }

  /**
   * Get recent performance entries
   */
  public getRecentEntries(count: number = 10): FramePerformanceEntry[] {
    return this.frameBuffer.slice(-count);
  }

  /**
   * Analyze performance data
   */
  public analyzePerformance(): FrameAnalysisResult {
    if (this.frameBuffer.length === 0) {
      return {
        entry: this.getCurrentMetrics(),
        metrics: this.getCurrentMetrics(),
        severity: PerformanceSeverity.UNKNOWN,
        recommendations: [],
        timestamp: Date.now(),
      };
    }

    const recentEntries = this.getRecentEntries(100);
    const metrics = recentEntries.map(entry => entry.metrics);
    
    // Calculate statistics
    const statistics = this.getStatistics();
    
    // Generate recommendations
    const recommendations = generateRecommendations(metrics, this.config.thresholds);
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(recentEntries);
    
    // Detect trends
    const trends = this.detectTrends(recentEntries);
    
    const result: FrameAnalysisResult = {
      entry: this.getRecentEntries(1)[0],
      metrics: this.getCurrentMetrics(),
      severity: getPerformanceSeverity(PerformanceMetricType.FPS, this.getCurrentMetrics().fps),
      recommendations,
      timestamp: Date.now(),
    };

    this.emit('analysis-completed', { statistics });
    
    return result;
  }

  /**
   * Detect performance anomalies
   */
  private detectAnomalies(entries: FramePerformanceEntry[]): string[] {
    const anomalies: string[] = [];
    
    // Detect FPS anomalies
    const fpsValues = entries.map(entry => entry.metrics.fps);
    const fpsMean = fpsValues.reduce((sum, fps) => sum + fps, 0) / fpsValues.length;
    const fpsStdDev = Math.sqrt(
      fpsValues.reduce((sum, fps) => Math.pow(fps - fpsMean, 2), 0) / fpsValues.length
    );
    
    // Check for significant deviations
    const fpsAnomalies = entries.filter(entry => {
      const fps = entry.metrics.fps;
      const deviation = Math.abs(fps - fpsMean);
      return deviation > fpsStdDev * 2; // 2 standard deviations
    });
    
    if (fpsAnomalies.length > 0) {
      anomalies.push(`FPS anomalies detected: ${fpsAnomalies.length} occurrences`);
    }

    // Detect memory usage anomalies
    const memoryValues = entries.map(entry => entry.metrics.memoryUsage);
    const memoryMean = memoryValues.reduce((sum, mem) => sum + mem, 0) / memoryValues.length;
    const memoryStdDev = Math.sqrt(
      memoryValues.reduce((sum, mem) => Math.pow(mem - memoryMean, 2), 0) / memoryValues.length
    );
    
    const memoryAnomalies = entries.filter(entry => {
      const memory = entry.metrics.memoryUsage;
      const deviation = Math.abs(memory - memoryMean);
      return deviation > memoryStdDev * 2; // 2 standard deviations
    });
    
    if (memoryAnomalies.length > 0) {
      anomalies.push(`Memory anomalies detected: ${memoryAnomalies.length} occurrences`);
    }

    return anomalies;
  }

  /**
   * Detect performance trends
   */
  private detectTrends(entries: FramePerformanceEntry[]): {
    const trends: string[] = [];
    
    // FPS trend analysis
    const fpsValues = entries.map(entry => entry.metrics.fps);
    if (fpsValues.length > 10) {
      const recent = fpsValues.slice(-10);
      const older = fpsValues.slice(-20, -10);
      const recentAvg = recent.reduce((sum, fps) => sum + fps, 0) / recent.length;
      const olderAvg = older.reduce((sum, fps) => sum + fps, 0) / older.length;
      
      if (recentAvg < olderAvg * 0.9) {
        trends.push('FPS declining trend detected');
      } else if (recentAvg > olderAvg * 1.1) {
        trends.push('FPS improving trend detected');
      } else {
        trends.push('FPS stable');
      }
    }

    // Frame time trend analysis
    const frameTimeValues = entries.map(entry => entry.metrics.frameTime);
    if (frameTimeValues.length > 10) {
      const recent = frameTimeValues.slice(-10);
      const older = frameTimeValues.slice(-20, -10);
      const recentAvg = recent.reduce((sum, time) => sum + time, 0) / recent.length;
      const olderAvg = older.reduce((sum, time) => sum + time, 0) / older.length;
      
      if (recentAvg > olderAvg * 1.1) {
        trends.push('Frame time increasing trend detected');
      } else if (recentAvg < olderAvg * 0.9) {
        trends.push('Frame time improving trend');
      } else {
        trends.push('Frame time stable');
      }
    }

    return trends;
  }

  /**
   * Export performance data
   */
  public exportData(): {
    const data = {
      entries: this.getFrameBuffer(),
      statistics: this.getStatistics(),
      config: this.config,
      timestamp: Date.now(),
    };

    return data;
  }

  /**
   * Export performance data to CSV
   */
  public exportToCSV(): string {
    const data = this.exportData();
    const headers = [
      'timestamp',
      'frameNumber',
      'duration',
      'fps',
      'frameTime',
      'memoryUsage',
      'cpuUsage',
      'renderTime',
      'scriptTime',
      'paintTime',
      'layoutShift',
      'longTasks',
      'interactionDelay',
      'networkRequests',
      'animationFrameDrops',
      'junk',
      'severity',
      'recommendations',
    ];

    const rows = [
      headers,
      ...data.entries.map(entry => [
        formatTimestamp(entry.timestamp),
        entry.frameNumber,
        entry.duration,
        formatPerformanceValue(PerformanceMetricType.FPS, entry.metrics.fps),
        formatPerformanceValue(PerformanceMetricType.FRAME_TIME, entry.metrics.frameTime),
        formatPerformanceValue(PerformanceMetricType.MEMORY_USAGE, entry.metrics.memoryUsage),
        formatPerformanceValue(PerformanceMetricType.CPU_USAGE, entry.metrics.cpuUsage),
        formatPerformanceValue(PerformanceMetricType.RENDER_TIME, entry.metrics.renderTime),
        formatPerformanceValue(PerformanceMetricType.SCRIPT_TIME, entry.metrics.scriptTime),
        formatPerformanceValue(PerformanceMetricType.PAINT_TIME, entry.metrics.paintTime),
        formatPerformanceValue(PerformanceMetricType.LAYOUT_SHIFT, entry.metrics.layoutShift),
        formatPerformanceValue(PerformanceMetricType.LONG_TASKS, entry.metrics.longTasks),
        formatPerformanceValue(PerformanceMetricType.INTERACTION_DELAY, entry.metrics.interactionDelay),
        formatPerformanceValue(PerformanceMetricType.NETWORK_REQUESTS, entry.metrics.networkRequests),
        formatPerformanceValue(PerformanceMetricType.ANIMATION_FRAME_DROPS, entry.metrics.animationFrameDrops),
        formatPerformanceValue(PerformanceMetricType.JUNK, entry.metrics.junk),
        entry.severity,
        entry.recommendations.map(r => r.title),
      ]),
    ];

    return rows.join('\n');
  }

  /**
   * Export performance data to JSON
   */
  exportToJSON(): string {
    const data = this.exportData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all data
   */
  public clearData(): void {
    this.frameBuffer = [];
    this.metricsHistory = [];
    this.statistics = {
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
      totalJunk: 0,
      totalLongTasks: 0,
      totalAnimationDrops: 0,
      sessionDuration: 0,
      recommendations: [],
    };
    
    this.emit('metrics-updated', {
      metrics: this.getCurrentMetrics(),
      statistics: this.statistics,
    });
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MapPerformanceProfilerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reconfigure observer if needed
    if (this.isObserving) {
      // Stop and restart with new config
      this.stop();
      this.start();
    }
  }

  /**
   * Get configuration
   */
  public getConfig(): MapPerformanceProfilerConfig {
    return { ...this.config };
  }

  /**
   * Destroy profiler and cleanup
   */
  public destroy(): void {
    this.stop();
    this.clearData();
    this.eventListeners.clear();
    
    diagnostics.info('Performance profiler destroyed');
  }
}
