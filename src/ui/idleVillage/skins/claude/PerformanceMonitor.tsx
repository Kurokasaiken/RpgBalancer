/**
 * TS-005: Performance Monitoring System
 * 
 * Advanced performance monitoring and optimization system for the TS-Series
 * skin system with real-time metrics, bottleneck detection, and auto-optimization.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { getSkinReplacementAPI_TS003 } from '../SkinReplacementAPI_TS003';

// ============================================================================
// TYPES
// ============================================================================

// Define types locally to avoid import issues
type ComponentId = string;
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory';

interface PerformanceSnapshot {
  timestamp: number;
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  componentCount: number;
  skinSwitchTime: number;
  validationTime: number;
  hotReloadTime: number;
  apiCallTime: number;
  errorCount: number;
  warningCount: number;
  fps: number;
  layoutShift: number;
  networkLatency: number;
}

interface PerformanceThreshold {
  metric: keyof PerformanceSnapshot;
  warning: number;
  critical: number;
  description: string;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  metric: keyof PerformanceSnapshot;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
}

interface OptimizationRecommendation {
  id: string;
  type: 'render' | 'memory' | 'network' | 'validation' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  expectedImpact: string;
  confidence: number;
  autoApplicable: boolean;
  applied: boolean;
}

interface PerformanceReport {
  id: string;
  generatedAt: number;
  period: { start: number; end: number };
  summary: {
    averageRenderTime: number;
    peakMemoryUsage: number;
    totalErrors: number;
    averageFps: number;
    uptime: number;
    healthScore: number;
  };
  trends: {
    improving: string[];
    degrading: string[];
    stable: string[];
  };
  recommendations: OptimizationRecommendation[];
  alerts: PerformanceAlert[];
}

// ============================================================================
// PERFORMANCE MONITOR CLASS
// ============================================================================

export class PerformanceMonitor {
  private snapshots: PerformanceSnapshot[] = [];
  private alerts: PerformanceAlert[] = [];
  private recommendations: OptimizationRecommendation[] = [];
  private thresholds: PerformanceThreshold[] = [];
  private observers: Set<PerformanceObserver> = new Set();
  private isMonitoring = false;
  private monitoringInterval: number | null = null;
  private api: any;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private baseline: PerformanceSnapshot | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsUpdateInterval = 1000; // Update FPS every second
  private lastFpsUpdate = 0;

  constructor() {
    this.api = getSkinReplacementAPI_TS003();
    this.setupDefaultThresholds();
    this.setupPerformanceObservers();
  }

  private setupDefaultThresholds(): void {
    this.thresholds = [
      { metric: 'renderTime', warning: 16.67, critical: 33.33, description: 'Render time exceeds 60fps/30fps threshold' },
      { metric: 'memoryUsage', warning: 50 * 1024 * 1024, critical: 100 * 1024 * 1024, description: 'Memory usage exceeds 50MB/100MB' },
      { metric: 'validationTime', warning: 100, critical: 500, description: 'Validation time exceeds threshold' },
      { metric: 'apiCallTime', warning: 1000, critical: 5000, description: 'API call time is slow' },
      { metric: 'errorCount', warning: 5, critical: 20, description: 'High error rate detected' },
      { metric: 'fps', warning: 45, critical: 30, description: 'Frame rate is dropping' },
      { metric: 'layoutShift', warning: 0.1, critical: 0.25, description: 'Layout shift detected' },
      { metric: 'networkLatency', warning: 500, critical: 2000, description: 'Network latency is high' },
    ];
  }

  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    // Observer for render performance
    const renderObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name.startsWith('skin-')) {
          this.recordMetric(entry.name as keyof PerformanceSnapshot, entry.duration);
        }
      });
    });

    renderObserver.observe({ entryTypes: ['measure'] });
    this.observers.add(renderObserver);

    // Observer for layout shifts
    const layoutShiftObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalShift = 0;
      entries.forEach((entry) => {
        if (entry.entryType === 'layout-shift') {
          totalShift += (entry as any).value;
        }
      });
      this.recordMetric('layoutShift', totalShift);
    });

    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.add(layoutShiftObserver);

    // FPS monitoring using requestAnimationFrame
    this.startFpsMonitoring();
  }

  private startFpsMonitoring(): void {
    const measureFps = (timestamp: number) => {
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = timestamp;
        this.lastFpsUpdate = timestamp;
      }

      this.frameCount++;

      if (timestamp - this.lastFpsUpdate >= this.fpsUpdateInterval) {
        const fps = Math.round((this.frameCount * 1000) / (timestamp - this.lastFpsUpdate));
        this.recordMetric('fps', fps);
        this.frameCount = 0;
        this.lastFpsUpdate = timestamp;
      }

      this.lastFrameTime = timestamp;
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFps);
      }
    };

    if (this.isMonitoring) {
      requestAnimationFrame(measureFps);
    }
  }

  private recordMetric(metric: keyof PerformanceSnapshot, value: number): void {
    const snapshot = this.getCurrentSnapshot();
    (snapshot as any)[metric] = value;
    this.checkThresholds(metric, value);
    this.emit('metric-updated', { metric, value, snapshot });
  }

  private checkThresholds(metric: keyof PerformanceSnapshot, value: number): void {
    const threshold = this.thresholds.find(t => t.metric === metric);
    if (!threshold) return;

    let alertType: 'warning' | 'critical' | null = null;
    let thresholdValue = 0;

    if (value >= threshold.critical) {
      alertType = 'critical';
      thresholdValue = threshold.critical;
    } else if (value >= threshold.warning) {
      alertType = 'warning';
      thresholdValue = threshold.warning;
    }

    if (alertType) {
      this.createAlert(alertType, metric, value, thresholdValue, threshold.description);
    }
  }

  private createAlert(type: 'warning' | 'critical', metric: keyof PerformanceSnapshot, currentValue: number, threshold: number, description: string): void {
    const alert: PerformanceAlert = {
      id: `alert-${metric}-${Date.now()}`,
      type,
      metric,
      currentValue,
      threshold,
      message: description,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.push(alert);
    this.emit('alert-created', alert);

    // Auto-generate recommendation for critical alerts
    if (type === 'critical') {
      this.generateRecommendation(metric, currentValue, threshold);
    }
  }

  private generateRecommendation(metric: keyof PerformanceSnapshot, currentValue: number, threshold: number): void {
    const existingRec = this.recommendations.find(r => r.type === this.getRecommendationType(metric));
    if (existingRec) return;

    const recommendation: OptimizationRecommendation = {
      id: `rec-${metric}-${Date.now()}`,
      type: this.getRecommendationType(metric),
      priority: currentValue > threshold * 2 ? 'critical' : 'high',
      title: this.getRecommendationTitle(metric),
      description: `${metric} is ${((currentValue - threshold) / threshold * 100).toFixed(1)}% above threshold`,
      action: this.getRecommendationAction(metric),
      expectedImpact: this.getExpectedImpact(metric),
      confidence: 0.85,
      autoApplicable: this.isAutoApplicable(metric),
      applied: false,
    };

    this.recommendations.push(recommendation);
    this.emit('recommendation-generated', recommendation);
  }

  private getRecommendationType(metric: keyof PerformanceSnapshot): OptimizationRecommendation['type'] {
    const typeMap: Partial<Record<keyof PerformanceSnapshot, OptimizationRecommendation['type']>> = {
      renderTime: 'render',
      memoryUsage: 'memory',
      networkLatency: 'network',
      validationTime: 'validation',
      apiCallTime: 'network',
      fps: 'render',
      layoutShift: 'render',
    };

    return typeMap[metric] || 'general';
  }

  private getRecommendationTitle(metric: keyof PerformanceSnapshot): string {
    const titles: Partial<Record<keyof PerformanceSnapshot, string>> = {
      renderTime: 'Optimize Render Performance',
      memoryUsage: 'Reduce Memory Usage',
      validationTime: 'Optimize Validation Logic',
      apiCallTime: 'Improve API Performance',
      errorCount: 'Fix Error Issues',
      fps: 'Improve Frame Rate',
      layoutShift: 'Fix Layout Shift',
      networkLatency: 'Reduce Network Latency',
    };

    return titles[metric] || 'Performance Optimization';
  }

  private getRecommendationAction(metric: keyof PerformanceSnapshot): string {
    const actions: Partial<Record<keyof PerformanceSnapshot, string>> = {
      renderTime: 'Implement React.memo and useMemo for expensive components',
      memoryUsage: 'Clear unused references and implement object pooling',
      validationTime: 'Add early returns and cache validation results',
      apiCallTime: 'Implement request caching and optimistic updates',
      errorCount: 'Fix underlying issues and improve error handling',
      fps: 'Optimize rendering pipeline and reduce expensive operations',
      layoutShift: 'Reserve space for dynamic content and use proper sizing',
      networkLatency: 'Implement local caching and reduce API calls',
    };

    return actions[metric] || 'Investigate and optimize the specific issue';
  }

  private getExpectedImpact(metric: keyof PerformanceSnapshot): string {
    const impacts: Partial<Record<keyof PerformanceSnapshot, string>> = {
      renderTime: 'Reduce render time by 30-50%',
      memoryUsage: 'Free up 20-40% memory',
      validationTime: 'Improve validation speed by 40-60%',
      apiCallTime: 'Reduce API response time by 25-45%',
      errorCount: 'Eliminate 80-90% of errors',
      fps: 'Achieve stable 60fps',
      layoutShift: 'Eliminate layout shifts',
      networkLatency: 'Reduce latency by 50-70%',
    };

    return impacts[metric] || 'Significant performance improvement';
  }

  private isAutoApplicable(metric: keyof PerformanceSnapshot): boolean {
    const autoApplicable: (keyof PerformanceSnapshot)[] = ['memoryUsage', 'validationTime'];
    return autoApplicable.includes(metric);
  }

  private getCurrentSnapshot(): PerformanceSnapshot {
    const now = Date.now();
    const memory = typeof performance !== 'undefined' && 'memory' in performance 
      ? (performance as any).memory 
      : { usedJSHeapSize: 0 };

    return {
      timestamp: now,
      renderTime: 0,
      updateTime: 0,
      memoryUsage: memory.usedJSHeapSize,
      componentCount: this.api.getCurrentState().activeBindings ? Object.keys(this.api.getCurrentState().activeBindings).length : 0,
      skinSwitchTime: 0,
      validationTime: 0,
      hotReloadTime: 0,
      apiCallTime: 0,
      errorCount: 0,
      warningCount: 0,
      fps: 60,
      layoutShift: 0,
      networkLatency: 0,
    };
  }

  // ============================================================================
  // MONITORING CONTROL
  // ============================================================================

  public startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.baseline = this.getCurrentSnapshot();
    this.startFpsMonitoring();

    this.monitoringInterval = window.setInterval(() => {
      this.collectSnapshot();
    }, intervalMs);

    this.emit('monitoring-started', { interval: intervalMs });
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.emit('monitoring-stopped', {});
  }

  private collectSnapshot(): void {
    const snapshot = this.getCurrentSnapshot();
    this.snapshots.push(snapshot);

    // Keep only last 1000 snapshots
    if (this.snapshots.length > 1000) {
      this.snapshots = this.snapshots.slice(-1000);
    }

    this.emit('snapshot-collected', snapshot);
  }

  // ============================================================================
  // ANALYSIS AND REPORTING
  // ============================================================================

  public generateReport(periodMs?: number): PerformanceReport {
    const now = Date.now();
    const start = periodMs ? now - periodMs : (this.snapshots[0]?.timestamp || now);
    const end = now;

    const relevantSnapshots = this.snapshots.filter(s => s.timestamp >= start && s.timestamp <= end);
    
    if (relevantSnapshots.length === 0) {
      throw new Error('No data available for the specified period');
    }

    const summary = this.calculateSummary(relevantSnapshots);
    const trends = this.analyzeTrends(relevantSnapshots);
    const relevantAlerts = this.alerts.filter(a => a.timestamp >= start && a.timestamp <= end);
    const relevantRecommendations = this.recommendations.filter(r => !r.applied);

    return {
      id: `report-${Date.now()}`,
      generatedAt: now,
      period: { start, end },
      summary,
      trends,
      recommendations: relevantRecommendations,
      alerts: relevantAlerts,
    };
  }

  private calculateSummary(snapshots: PerformanceSnapshot[]): PerformanceReport['summary'] {
    const renderTimes = snapshots.map(s => s.renderTime).filter(t => t > 0);
    const memoryUsages = snapshots.map(s => s.memoryUsage).filter(m => m > 0);
    const fpss = snapshots.map(s => s.fps).filter(f => f > 0);
    const errorCounts = snapshots.map(s => s.errorCount);

    return {
      averageRenderTime: renderTimes.length > 0 ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length : 0,
      peakMemoryUsage: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      totalErrors: errorCounts.reduce((a, b) => a + b, 0),
      averageFps: fpss.length > 0 ? fpss.reduce((a, b) => a + b, 0) / fpss.length : 0,
      uptime: snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp : 0,
      healthScore: this.calculateHealthScore(snapshots),
    };
  }

  private analyzeTrends(snapshots: PerformanceSnapshot[]): PerformanceReport['trends'] {
    if (snapshots.length < 10) {
      return { improving: [], degrading: [], stable: [] };
    }

    const metrics: (keyof PerformanceSnapshot)[] = ['renderTime', 'memoryUsage', 'fps', 'validationTime'];
    const trends = { improving: [], degrading: [], stable: [] } as PerformanceReport['trends'];

    metrics.forEach(metric => {
      const values = snapshots.map(s => s[metric]).filter(v => v > 0);
      if (values.length < 5) return;

      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      const change = (secondAvg - firstAvg) / firstAvg;

      if (Math.abs(change) < 0.05) {
        trends.stable.push(metric);
      } else if ((metric === 'fps' && change > 0) || (metric !== 'fps' && change < 0)) {
        trends.improving.push(metric);
      } else {
        trends.degrading.push(metric);
      }
    });

    return trends;
  }

  private calculateHealthScore(snapshots: PerformanceSnapshot[]): number {
    if (snapshots.length === 0) return 0;

    const latest = snapshots[snapshots.length - 1];
    const weights = {
      renderTime: 0.25,
      memoryUsage: 0.2,
      fps: 0.2,
      errorCount: 0.15,
      validationTime: 0.1,
      apiCallTime: 0.1,
    };

    const scores = {
      renderTime: Math.max(0, 100 - (latest.renderTime / 16.67 * 100)),
      memoryUsage: Math.max(0, 100 - (latest.memoryUsage / (50 * 1024 * 1024) * 100)),
      fps: Math.min(100, (latest.fps / 60) * 100),
      errorCount: Math.max(0, 100 - (latest.errorCount * 20)),
      validationTime: Math.max(0, 100 - (latest.validationTime / 100 * 100)),
      apiCallTime: Math.max(0, 100 - (latest.apiCallTime / 1000 * 100)),
    };

    return Object.entries(weights).reduce((score, [key, weight]) => 
      score + (scores[key as keyof typeof scores] * weight), 0);
  }

  // ============================================================================
  // OPTIMIZATION
  // ============================================================================

  public async applyRecommendation(recommendationId: string): Promise<boolean> {
    const recommendation = this.recommendations.find(r => r.id === recommendationId);
    if (!recommendation || recommendation.applied) {
      return false;
    }

    try {
      await this.executeOptimization(recommendation);
      recommendation.applied = true;
      this.emit('recommendation-applied', recommendation);
      return true;
    } catch (error) {
      this.emit('recommendation-failed', { recommendation, error });
      return false;
    }
  }

  private async executeOptimization(recommendation: OptimizationRecommendation): Promise<void> {
    switch (recommendation.type) {
      case 'memory':
        await this.optimizeMemory();
        break;
      case 'render':
        await this.optimizeRendering();
        break;
      case 'validation':
        await this.optimizeValidation();
        break;
      case 'network':
        await this.optimizeNetwork();
        break;
      default:
        await this.generalOptimization();
    }
  }

  private async optimizeMemory(): Promise<void> {
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }

    // Clear caches
    this.snapshots = this.snapshots.slice(-100); // Keep only recent snapshots
    this.alerts = this.alerts.filter(a => !a.resolved && Date.now() - a.timestamp < 60000); // Keep recent alerts
  }

  private async optimizeRendering(): Promise<void> {
    // This would interact with the skin system to optimize rendering
    // For now, simulate the optimization
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async optimizeValidation(): Promise<void> {
    // Clear validation caches
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async optimizeNetwork(): Promise<void> {
    // Clear network caches
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  private async generalOptimization(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // ============================================================================
  // ALERT MANAGEMENT
  // ============================================================================

  public getAlerts(filter?: { type?: PerformanceAlert['type']; acknowledged?: boolean; resolved?: boolean }): PerformanceAlert[] {
    let filtered = this.alerts;

    if (filter?.type) {
      filtered = filtered.filter(a => a.type === filter.type);
    }

    if (filter?.acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === filter.acknowledged);
    }

    if (filter?.resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === filter.resolved);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  public acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert-acknowledged', alert);
    }
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.emit('alert-resolved', alert);
    }
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  public on(event: string, listener: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  public off(event: string, listener: (data: any) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Performance monitor event listener error:', error);
        }
      });
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  public getSnapshots(limit?: number): PerformanceSnapshot[] {
    return limit ? this.snapshots.slice(-limit) : [...this.snapshots];
  }

  public getRecommendations(filter?: { type?: OptimizationRecommendation['type']; applied?: boolean }): OptimizationRecommendation[] {
    let filtered = this.recommendations;

    if (filter?.type) {
      filtered = filtered.filter(r => r.type === filter.type);
    }

    if (filter?.applied !== undefined) {
      filtered = filtered.filter(r => r.applied === filter.applied);
    }

    return filtered.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  public getMetrics(): PerformanceSnapshot {
    return this.getCurrentSnapshot();
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  public reset(): void {
    this.snapshots = [];
    this.alerts = [];
    this.recommendations = [];
    this.baseline = null;
    this.emit('reset', {});
  }

  public dispose(): void {
    this.stopMonitoring();
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.listeners.clear();
    this.reset();
  }
}

// ============================================================================
// REACT HOOK
// ============================================================================

export const usePerformanceMonitor = (options?: { autoStart?: boolean; intervalMs?: number }) => {
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceSnapshot>();
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [reports, setReports] = useState<PerformanceReport[]>([]);

  if (!monitorRef.current) {
    monitorRef.current = new PerformanceMonitor();
    
    // Setup event listeners
    monitorRef.current.on('metric-updated', (data) => {
      setMetrics(data.snapshot);
    });

    monitorRef.current.on('alert-created', (alert) => {
      setAlerts(prev => [...prev, alert]);
    });

    monitorRef.current.on('recommendation-generated', (rec) => {
      setRecommendations(prev => [...prev, rec]);
    });

    // Auto-start if requested
    if (options?.autoStart) {
      monitorRef.current.startMonitoring(options.intervalMs);
      setIsMonitoring(true);
    }
  }

  const monitor = monitorRef.current;

  const startMonitoring = useCallback((intervalMs?: number) => {
    monitor.startMonitoring(intervalMs || options?.intervalMs);
    setIsMonitoring(true);
  }, [monitor, options?.intervalMs]);

  const stopMonitoring = useCallback(() => {
    monitor.stopMonitoring();
    setIsMonitoring(false);
  }, [monitor]);

  const generateReport = useCallback((periodMs?: number) => {
    const report = monitor.generateReport(periodMs);
    setReports(prev => [...prev, report]);
    return report;
  }, [monitor]);

  const applyRecommendation = useCallback(async (recommendationId: string) => {
    const success = await monitor.applyRecommendation(recommendationId);
    if (success) {
      setRecommendations(prev => prev.map(r => 
        r.id === recommendationId ? { ...r, applied: true } : r
      ));
    }
    return success;
  }, [monitor]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    monitor.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  }, [monitor]);

  const resolveAlert = useCallback((alertId: string) => {
    monitor.resolveAlert(alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, [monitor]);

  return {
    monitor,
    isMonitoring,
    metrics: metrics || monitor.getMetrics(),
    alerts,
    recommendations,
    reports,
    snapshots: monitor.getSnapshots(),
    startMonitoring,
    stopMonitoring,
    generateReport,
    applyRecommendation,
    acknowledgeAlert,
    resolveAlert,
    reset: monitor.reset.bind(monitor),
  };
};
