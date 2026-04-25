/**
 * Mobile Playtest Logger - NP-225
 * 
 * Enhanced event capture, interaction heatmaps, and automated bug reports.
 * 
 * @since 2026-01-24
 */

import {
  DEFAULT_PLAYTEST_CONFIG,
  type PlaytestConfig,
  type PlaytestEvent,
  type PlaytestSession,
  type HeatmapPoint,
  type BugReport,
  type DeviceInfo,
  type PlaytestEventType,
  generateEventId,
  generateSessionId,
  getDeviceInfo,
  isInteractionEvent,
  isErrorEvent,
  getEventSeverity,
  compressSession,
  decompressSession,
  anonymizeEvent,
  filterSensitiveContent,
} from '../config/playtestConfig';

// Re-export types for component use
export type { PlaytestConfig, PlaytestEvent, PlaytestSession, HeatmapPoint, BugReport, DeviceInfo };

export interface PlaytestSessionStats {
  duration: number;
  eventCount: number;
  interactionCount: number;
  errorCount: number;
  bugReportCount: number;
  heatmapPointCount: number;
  averageFPS?: number;
  memoryUsage?: number;
}

/**
 * Playtest Logger System
 */
export class PlaytestLogger {
  private config: PlaytestConfig;
  private currentSession: PlaytestSession | null = null;
  private eventBuffer: PlaytestEvent[] = [];
  private heatmapData: HeatmapPoint[] = [];
  private bugReports: BugReport[] = [];
  private performanceMonitor: PerformanceMonitor | null = null;
  private eventListeners: Map<string, EventListener> = new Map();
  private isRecording = false;

  constructor(config: Partial<PlaytestConfig> = {}) {
    this.config = { ...DEFAULT_PLAYTEST_CONFIG, ...config };
    this.initializePerformanceMonitor();
  }

  /**
   * Return the most recent events from the buffer for debugging/snapshotting purposes.
   */
  getRecentEvents(limit = 25): PlaytestEvent[] {
    if (this.eventBuffer.length === 0) {
      return [];
    }

    const startIndex = Math.max(0, this.eventBuffer.length - limit);
    return this.eventBuffer.slice(startIndex).map((event) => ({
      ...event,
      coordinates: event.coordinates ? { ...event.coordinates } : undefined,
      performanceMetrics: event.performanceMetrics
        ? { ...event.performanceMetrics }
        : undefined,
    }));
  }

  /**
   * Start a new playtest session
   */
  async startSession(userId?: string): Promise<string> {
    const sessionId = generateSessionId();
    const deviceInfo = getDeviceInfo();
    
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      deviceInfo,
      events: [],
      userId,
      buildVersion: this.getBuildVersion(),
      platform: this.getPlatform(),
      completed: false,
      crashDetected: false,
      errorCount: 0,
      interactionCount: 0,
    };

    this.eventBuffer = [];
    this.heatmapData = [];
    this.bugReports = [];
    this.isRecording = true;

    // Start performance monitoring
    if (this.config.performance.enabled) {
      this.performanceMonitor?.start();
    }

    // Add session start event
    this.logEvent({
      type: 'session_start',
      value: { sessionId, userId },
    });

    // Setup global error handlers
    this.setupErrorHandlers();

    return sessionId;
  }

  /**
   * End current playtest session
   */
  async endSession(): Promise<PlaytestSession | null> {
    if (!this.currentSession || !this.isRecording) {
      return null;
    }

    this.isRecording = false;
    const endTime = Date.now();
    
    // Add session end event
    this.logEvent({
      type: 'session_end',
      value: { duration: endTime - this.currentSession.startTime },
    });

    // Stop performance monitoring
    this.performanceMonitor?.stop();

    // Finalize session
    this.currentSession.endTime = endTime;
    this.currentSession.duration = endTime - this.currentSession.startTime;
    this.currentSession.events = [...this.eventBuffer];
    this.currentSession.completed = true;

    // Auto-save if enabled
    if (this.config.logging.autoSave) {
      await this.saveSession();
    }

    // Cleanup
    this.cleanup();

    return this.currentSession;
  }

  /**
   * Log a playtest event
   */
  logEvent(event: Partial<PlaytestEvent> & Pick<PlaytestEvent, 'type'>): void {
    if (!this.isRecording || !this.currentSession) {
      return;
    }

    const fullEvent: PlaytestEvent = {
      id: generateEventId(),
      timestamp: Date.now(),
      sessionId: this.currentSession.id,
      userId: this.currentSession.userId,
      ...event,
    };

    // Anonymize if privacy enabled
    const processedEvent = anonymizeEvent(fullEvent);

    // Add to buffer
    this.eventBuffer.push(processedEvent);

    // Update session counters
    if (isInteractionEvent(processedEvent.type)) {
      this.currentSession.interactionCount++;
    }
    if (isErrorEvent(processedEvent.type)) {
      this.currentSession.errorCount++;
      this.currentSession.crashDetected = processedEvent.type === 'crash';
    }

    // Add to heatmap if interaction
    if (this.config.heatmap.enabled && isInteractionEvent(processedEvent.type)) {
      this.addToHeatmap(processedEvent);
    }

    // Auto-detect bug reports
    if (this.config.bugReporting.autoDetect && isErrorEvent(processedEvent.type)) {
      this.createBugReport(processedEvent);
    }

    // Check buffer size limit
    if (this.eventBuffer.length >= this.config.logging.maxEventsPerSession) {
      this.eventBuffer.shift(); // Remove oldest event
    }
  }

  /**
   * Get current session info
   */
  getCurrentSession(): PlaytestSession | null {
    return this.currentSession;
  }

  /**
   * Get heatmap data
   */
  getHeatmapData(): HeatmapPoint[] {
    return this.heatmapData;
  }

  /**
   * Get bug reports
   */
  getBugReports(): BugReport[] {
    return this.bugReports;
  }

  /**
   * Create manual bug report
   */
  createManualBugReport(report: Omit<BugReport, 'id' | 'sessionId' | 'timestamp' | 'createdAt' | 'updatedAt' | 'environment'>): string {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const bugReport: BugReport = {
      ...report,
      id: `bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.currentSession.id,
      timestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      environment: {
        device: this.currentSession.deviceInfo,
        buildVersion: this.currentSession.buildVersion,
        platform: this.currentSession.platform,
      },
      resolved: false,
    };

    this.bugReports.push(bugReport);
    return bugReport.id;
  }

  /**
   * Save session to storage
   */
  async saveSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      const compressed = await compressSession(this.currentSession);
      
      // In a real implementation, save to appropriate storage
      console.log('Session saved:', compressed.length, 'bytes');
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Load session from storage
   */
  async loadSession(sessionId: string): Promise<PlaytestSession | null> {
    try {
      // In a real implementation, load from appropriate storage
      console.log('Loading session:', sessionId);
      return null;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  /**
   * Export session data
   */
  async exportSession(format: 'json' | 'csv' = 'json'): Promise<string> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    if (format === 'json') {
      return JSON.stringify(this.currentSession, null, 2);
    }

    if (format === 'csv') {
      return this.exportToCSV();
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Get session statistics
   */
  getSessionStats(): PlaytestSessionStats {
    if (!this.currentSession) {
      return {
        duration: 0,
        eventCount: 0,
        interactionCount: 0,
        errorCount: 0,
        bugReportCount: 0,
        heatmapPointCount: 0,
      };
    }

    const duration = this.isRecording ? Date.now() - this.currentSession.startTime : 
                     (this.currentSession.duration || 0);

    return {
      duration,
      eventCount: this.eventBuffer.length,
      interactionCount: this.currentSession.interactionCount,
      errorCount: this.currentSession.errorCount,
      bugReportCount: this.bugReports.length,
      heatmapPointCount: this.heatmapData.length,
      averageFPS: this.performanceMonitor?.getAverageFPS(),
      memoryUsage: this.performanceMonitor?.getCurrentMemory(),
    };
  }

  /**
   * Private methods
   */

  private initializePerformanceMonitor(): void {
    if (this.config.performance.enabled) {
      this.performanceMonitor = new PerformanceMonitor(this.config.performance);
    }
  }

  private setupErrorHandlers(): void {
    // Global error handler
    const errorHandler = (event: ErrorEvent) => {
      this.logEvent({
        type: 'error',
        value: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        },
      });
    };

    // Unhandled promise rejection handler
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      this.logEvent({
        type: 'error',
        value: {
          reason: event.reason,
          promise: event.promise,
        },
      });
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    this.eventListeners.set('error', errorHandler);
    this.eventListeners.set('unhandledrejection', rejectionHandler);
  }

  private cleanup(): void {
    // Remove event listeners
    this.eventListeners.forEach((listener, event) => {
      window.removeEventListener(event, listener);
    });
    this.eventListeners.clear();

    // Stop performance monitor
    this.performanceMonitor?.stop();
    this.performanceMonitor = null;
  }

  private addToHeatmap(event: PlaytestEvent): void {
    if (!event.coordinates) {
      return;
    }

    const point: HeatmapPoint = {
      x: event.coordinates.x,
      y: event.coordinates.y,
      intensity: 1,
      type: event.type,
      timestamp: event.timestamp,
    };

    this.heatmapData.push(point);

    // Limit heatmap points
    if (this.heatmapData.length > this.config.heatmap.maxPoints) {
      this.heatmapData.shift();
    }
  }

  private createBugReport(event: PlaytestEvent): void {
    if (this.bugReports.length >= this.config.bugReporting.maxReportsPerSession) {
      return;
    }

    const severity = getEventSeverity(event);
    const threshold = this.config.bugReporting.severityThreshold;

    // Check severity threshold
    if (severity === 'low' && threshold === 'medium') return;
    if (severity === 'low' && threshold === 'high') return;
    if (severity === 'low' && threshold === 'critical') return;
    if (severity === 'medium' && threshold === 'high') return;
    if (severity === 'medium' && threshold === 'critical') return;
    if (severity === 'high' && threshold === 'critical') return;

    const bugReport: BugReport = {
      id: `auto_bug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.currentSession!.id,
      timestamp: event.timestamp,
      type: event.type === 'crash' ? 'crash' : 'error',
      severity,
      title: `Auto-detected ${event.type}`,
      description: filterSensitiveContent(event.value?.toString() || 'Unknown error'),
      steps: ['1. Event occurred during playtest'],
      expected: 'No errors',
      actual: filterSensitiveContent(event.value?.toString() || 'Unknown error'),
      environment: {
        device: this.currentSession!.deviceInfo,
        buildVersion: this.currentSession!.buildVersion,
        platform: this.currentSession!.platform,
      },
      attachments: {
        logs: [JSON.stringify(event)],
        performance: this.performanceMonitor?.getMetrics() || {},
      },
      resolved: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.bugReports.push(bugReport);
  }

  private getBuildVersion(): string {
    // In a real implementation, get from build config
    return '1.0.0';
  }

  private getPlatform(): string {
    return navigator.platform;
  }

  private exportToCSV(): string {
    if (!this.currentSession) {
      return '';
    }

    const headers = ['Timestamp', 'Type', 'Element', 'Coordinates', 'Duration', 'Value'];
    const rows = this.eventBuffer.map(event => [
      event.timestamp,
      event.type,
      event.element || '',
      event.coordinates ? `${event.coordinates.x},${event.coordinates.y}` : '',
      event.duration || '',
      JSON.stringify(event.value || ''),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  private config: PlaytestConfig['performance'];
  private metrics: Map<string, number[]> = new Map();
  private isMonitoring = false;
  private intervalId: number | null = null;

  constructor(config: PlaytestConfig['performance']) {
    this.config = config;
    this.initializeMetrics();
  }

  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.intervalId = window.setInterval(() => {
      this.collectMetrics();
    }, this.config.sampleInterval);
  }

  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};

    for (const [metric, values] of this.metrics) {
      if (values.length > 0) {
        const latest = values[values.length - 1];
        result[metric] = latest;
      }
    }

    return result;
  }

  getAverageFPS(): number {
    const fpsValues = this.metrics.get('fps') || [];
    if (fpsValues.length === 0) return 60;
    return fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
  }

  getCurrentMemory(): number {
    const memoryValues = this.metrics.get('memory') || [];
    return memoryValues.length > 0 ? memoryValues[memoryValues.length - 1] : 0;
  }

  private initializeMetrics(): void {
    this.config.metrics.forEach(metric => {
      this.metrics.set(metric, []);
    });
  }

  private collectMetrics(): void {
    this.config.metrics.forEach(metric => {
      switch (metric) {
        case 'fps':
          this.collectFPS();
          break;
        case 'memory':
          this.collectMemory();
          break;
        case 'timing':
          this.collectTiming();
          break;
        case 'network':
          this.collectNetwork();
          break;
      }
    });
  }

  private collectFPS(): void {
    const fps = this.calculateFPS();
    this.addMetric('fps', fps);
  }

  private collectMemory(): void {
    const memory = (performance as any).memory?.usedJSHeapSize || 0;
    this.addMetric('memory', memory);
  }

  private collectTiming(): void {
    const timing = performance.now();
    this.addMetric('timing', timing);
  }

  private collectNetwork(): void {
    const connection = (navigator as any).connection;
    const rtt = connection?.rtt || 0;
    this.addMetric('network', rtt);
  }

  private calculateFPS(): number {
    // Simple FPS calculation
    return 60; // Placeholder - would use proper FPS calculation
  }

  private addMetric(metric: string, value: number): void {
    const values = this.metrics.get(metric) || [];
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
    
    this.metrics.set(metric, values);
  }
}

/**
 * Global playtest logger instance
 */
let globalPlaytestLogger: PlaytestLogger | null = null;

export function getPlaytestLogger(config?: Partial<PlaytestConfig>): PlaytestLogger {
  if (!globalPlaytestLogger) {
    globalPlaytestLogger = new PlaytestLogger(config);
  }
  return globalPlaytestLogger;
}
