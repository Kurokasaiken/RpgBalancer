/**
 * Idle Village Drop Suggestion Telemetry Analytics
 * 
 * Analytics module for drop suggestion telemetry with audit support.
 * Provides aggregation, trend analysis, and alert generation for
 * AI suggestion performance monitoring.
 * 
 * @module src/analytics/idleVillageDropTelemetry
 * @since NP-106
 * @author Sentinel-Drop – Telemetry Audit
 */

import type { 
  DropAITelemetryEvent,
  SuggestionsGeneratedEvent,
  SuggestionShownEvent,
  SuggestionClickedEvent,
  SuggestionAcceptedEvent,
  SuggestionRejectedEvent,
  AIPerformanceMetricsEvent
} from '@/ui/idleVillage/utils/dropAITelemetry';

/**
 * Analytics configuration for drop suggestion telemetry
 */
export interface IdleVillageDropTelemetryConfig {
  /** Enable usage analytics */
  enableUsageAnalytics: boolean;
  /** Enable accuracy analytics */
  enableAccuracyAnalytics: boolean;
  /** Enable performance analytics */
  enablePerformanceAnalytics: boolean;
  /** Enable trend analysis */
  enableTrendAnalysis: boolean;
  /** Data retention period in days */
  retentionDays: number;
  /** Alert thresholds */
  alertThresholds: {
    lowAccuracyThreshold: number;
    lowUsageThreshold: number;
    highErrorRateThreshold: number;
    slowGenerationThreshold: number;
  };
}

/**
 * Aggregated metrics for drop suggestions
 */
export interface DropSuggestionMetrics {
  /** Time window for metrics */
  timeWindow: {
    start: number;
    end: number;
    durationHours: number;
  };
  /** Usage metrics */
  usage: {
    totalSuggestionsGenerated: number;
    totalSuggestionsShown: number;
    totalSuggestionsClicked: number;
    totalSuggestionsAccepted: number;
    totalSuggestionsRejected: number;
    clickThroughRate: number;
    acceptanceRate: number;
    rejectionRate: number;
    averageTimeToClick: number;
    averageTimeToAccept: number;
  };
  /** Accuracy metrics */
  accuracy: {
    successPredictionAccuracy: number;
    yieldPredictionAccuracy: number;
    riskPredictionAccuracy: number;
    overallAccuracy: number;
    confidenceVsActualCorrelation: number;
    averageConfidence: number;
  };
  /** Performance metrics */
  performance: {
    averageGenerationTime: number;
    cacheHitRate: number;
    errorRate: number;
    memoryUsage: number;
    algorithmEfficiency: number;
  };
  /** Trend metrics */
  trends: {
    usageTrend: 'increasing' | 'decreasing' | 'stable';
    accuracyTrend: 'improving' | 'declining' | 'stable';
    performanceTrend: 'improving' | 'declining' | 'stable';
  };
}

/**
 * Alert for drop suggestion telemetry
 */
export interface DropSuggestionAlert {
  id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'accuracy' | 'usage' | 'performance' | 'data_quality';
  title: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  recommendation?: string;
  resolved: boolean;
}

/**
 * Analytics result with alerts
 */
export interface DropSuggestionAnalyticsResult {
  metrics: DropSuggestionMetrics;
  alerts: DropSuggestionAlert[];
  insights: string[];
  recommendations: string[];
  metadata: {
    totalEvents: number;
    validEvents: number;
    timeWindowHours: number;
    generatedAt: number;
  };
}

/**
 * Default analytics configuration
 */
const DEFAULT_CONFIG: IdleVillageDropTelemetryConfig = {
  enableUsageAnalytics: true,
  enableAccuracyAnalytics: true,
  enablePerformanceAnalytics: true,
  enableTrendAnalysis: true,
  retentionDays: 30,
  alertThresholds: {
    lowAccuracyThreshold: 0.7,
    lowUsageThreshold: 0.1,
    highErrorRateThreshold: 0.05,
    slowGenerationThreshold: 1000,
  },
};

/**
 * Drop Suggestion Telemetry Analytics Engine
 */
export class IdleVillageDropTelemetryAnalytics {
  private config: IdleVillageDropTelemetryConfig;
  private eventHistory: DropAITelemetryEvent[] = [];
  private alerts: DropSuggestionAlert[] = [];

  constructor(config: Partial<IdleVillageDropTelemetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add telemetry events for analysis
   */
  addEvents(events: DropAITelemetryEvent[]): void {
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    
    // Filter events by retention period and validate
    const validEvents = events.filter(event => 
      event.timestamp >= cutoffTime && this.isValidEvent(event)
    );
    
    this.eventHistory.push(...validEvents);
    
    // Sort by timestamp for trend analysis
    this.eventHistory.sort((a, b) => a.timestamp - b.timestamp);
    
    // Trim old events
    this.eventHistory = this.eventHistory.filter(event => event.timestamp >= cutoffTime);
  }

  /**
   * Validate telemetry event structure
   */
  private isValidEvent(event: unknown): event is DropAITelemetryEvent {
    return (
      event !== null &&
      typeof event === 'object' &&
      'eventType' in event &&
      'timestamp' in event &&
      'sessionId' in event &&
      'data' in event &&
      typeof (event as any).eventType === 'string' &&
      typeof (event as any).timestamp === 'number' &&
      typeof (event as any).sessionId === 'string'
    );
  }

  /**
   * Run comprehensive analytics
   */
  runAnalytics(timeWindowHours: number = 24): DropSuggestionAnalyticsResult {
    const now = Date.now();
    const windowStart = now - (timeWindowHours * 60 * 60 * 1000);
    
    // Filter events by time window
    const windowEvents = this.eventHistory.filter(event => 
      event.timestamp >= windowStart && event.timestamp <= now
    );

    if (windowEvents.length === 0) {
      return this.createEmptyResult(timeWindowHours);
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(windowEvents, windowStart, now, timeWindowHours);
    
    // Generate alerts
    this.generateAlerts(metrics);
    
    // Generate insights and recommendations
    const insights = this.generateInsights(metrics);
    const recommendations = this.generateRecommendations(metrics, this.alerts);

    return {
      metrics,
      alerts: [...this.alerts],
      insights,
      recommendations,
      metadata: {
        totalEvents: this.eventHistory.length,
        validEvents: windowEvents.length,
        timeWindowHours,
        generatedAt: now,
      },
    };
  }

  /**
   * Calculate comprehensive metrics
   */
  private calculateMetrics(
    events: DropAITelemetryEvent[],
    windowStart: number,
    windowEnd: number,
    timeWindowHours: number
  ): DropSuggestionMetrics {
    const usage = this.config.enableUsageAnalytics 
      ? this.calculateUsageMetrics(events)
      : this.getEmptyUsageMetrics();
    
    const accuracy = this.config.enableAccuracyAnalytics
      ? this.calculateAccuracyMetrics(events)
      : this.getEmptyAccuracyMetrics();
    
    const performance = this.config.enablePerformanceAnalytics
      ? this.calculatePerformanceMetrics(events)
      : this.getEmptyPerformanceMetrics();
    
    const trends = this.config.enableTrendAnalysis
      ? this.calculateTrends(events, windowStart, windowEnd)
      : this.getEmptyTrends();

    return {
      timeWindow: {
        start: windowStart,
        end: windowEnd,
        durationHours: timeWindowHours,
      },
      usage,
      accuracy,
      performance,
      trends,
    };
  }

  /**
   * Calculate usage metrics
   */
  private calculateUsageMetrics(events: DropAITelemetryEvent[]) {
    const generated = events.filter(e => e.eventType === 'suggestions_generated').length;
    const shown = events.filter(e => e.eventType === 'suggestion_shown').length;
    const clicked = events.filter(e => e.eventType === 'suggestion_clicked').length;
    const accepted = events.filter(e => e.eventType === 'suggestion_accepted').length;
    const rejected = events.filter(e => e.eventType === 'suggestion_rejected').length;

    const clickEvents = events.filter(
      (e): e is SuggestionClickedEvent => e.eventType === 'suggestion_clicked'
    );
    const acceptEvents = events.filter(
      (e): e is SuggestionAcceptedEvent => e.eventType === 'suggestion_accepted'
    );

    const clickThroughRate = shown > 0 ? clicked / shown : 0;
    const acceptanceRate = clicked > 0 ? accepted / clicked : 0;
    const rejectionRate = clicked > 0 ? rejected / clicked : 0;

    const avgTimeToClick = clickEvents.length > 0
      ? clickEvents.reduce((sum, e) => sum + e.data.timeToClick, 0) / clickEvents.length
      : 0;

    const avgTimeToAccept = acceptEvents.length > 0
      ? acceptEvents.reduce((sum, e) => sum + e.data.timeToAccept, 0) / acceptEvents.length
      : 0;

    return {
      totalSuggestionsGenerated: generated,
      totalSuggestionsShown: shown,
      totalSuggestionsClicked: clicked,
      totalSuggestionsAccepted: accepted,
      totalSuggestionsRejected: rejected,
      clickThroughRate,
      acceptanceRate,
      rejectionRate,
      averageTimeToClick: avgTimeToClick,
      averageTimeToAccept: avgTimeToAccept,
    };
  }

  /**
   * Calculate accuracy metrics
   */
  private calculateAccuracyMetrics(events: DropAITelemetryEvent[]) {
    const acceptedEvents = events.filter(
      (e): e is SuggestionAcceptedEvent => e.eventType === 'suggestion_accepted'
    );

    if (acceptedEvents.length === 0) {
      return this.getEmptyAccuracyMetrics();
    }

    const successPredictions = acceptedEvents.filter(
      e => e.data.suggestionAccuracy?.successPredictionAccurate
    ).length;
    const yieldPredictions = acceptedEvents.filter(
      e => e.data.suggestionAccuracy?.yieldPredictionAccurate
    ).length;
    const riskPredictions = acceptedEvents.filter(
      e => e.data.suggestionAccuracy?.riskPredictionAccurate
    ).length;

    const successAccuracy = successPredictions / acceptedEvents.length;
    const yieldAccuracy = yieldPredictions / acceptedEvents.length;
    const riskAccuracy = riskPredictions / acceptedEvents.length;

    // Calculate confidence vs actual correlation
    const confidenceData = acceptedEvents.map(e => ({
      confidence: this.getSuggestionConfidence(e.suggestionId, events),
      actual: e.data.actualOutcome?.success ? 1 : 0,
    })).filter(d => d.confidence !== null);

    const correlation = this.calculateCorrelation(
      confidenceData.map(d => d.confidence!),
      confidenceData.map(d => d.actual)
    );

    // Calculate average confidence
    const shownEvents = events.filter(
      (e): e is SuggestionShownEvent => e.eventType === 'suggestion_shown'
    );
    const avgConfidence = shownEvents.length > 0
      ? shownEvents.reduce((sum, e) => sum + e.data.confidence, 0) / shownEvents.length
      : 0;

    return {
      successPredictionAccuracy: successAccuracy,
      yieldPredictionAccuracy: yieldAccuracy,
      riskPredictionAccuracy: riskAccuracy,
      overallAccuracy: (successAccuracy + yieldAccuracy + riskAccuracy) / 3,
      confidenceVsActualCorrelation: correlation,
      averageConfidence: avgConfidence,
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(events: DropAITelemetryEvent[]) {
    const generatedEvents = events.filter(
      (e): e is SuggestionsGeneratedEvent => e.eventType === 'suggestions_generated'
    );
    const performanceEvents = events.filter(
      (e): e is AIPerformanceMetricsEvent => e.eventType === 'ai_performance_metrics'
    );

    const avgGenerationTime = generatedEvents.length > 0
      ? generatedEvents.reduce((sum, e) => sum + e.data.generationTimeMs, 0) / generatedEvents.length
      : 0;

    const cacheHitRate = generatedEvents.length > 0
      ? generatedEvents.filter(e => e.data.cacheHit).length / generatedEvents.length
      : 0;

    const errorRate = events.filter(e => e.eventType === 'error_occurred').length / events.length;

    // Get performance metrics from dedicated events
    let memoryUsage = 0;
    let algorithmEfficiency = 0;

    if (performanceEvents.length > 0) {
      const latest = performanceEvents[performanceEvents.length - 1];
      memoryUsage = latest.data.systemPerformance.memoryUsage;
      algorithmEfficiency = latest.data.userSatisfaction.acceptanceRate;
    }

    return {
      averageGenerationTime: avgGenerationTime,
      cacheHitRate,
      errorRate,
      memoryUsage,
      algorithmEfficiency,
    };
  }

  /**
   * Calculate trends
   */
  private calculateTrends(events: DropAITelemetryEvent[], windowStart: number, windowEnd: number) {
    const midPoint = windowStart + (windowEnd - windowStart) / 2;
    
    const firstHalf = events.filter(e => e.timestamp < midPoint);
    const secondHalf = events.filter(e => e.timestamp >= midPoint);

    const firstUsage = this.calculateUsageMetrics(firstHalf);
    const secondUsage = this.calculateUsageMetrics(secondHalf);
    
    const firstAccuracy = this.calculateAccuracyMetrics(firstHalf);
    const secondAccuracy = this.calculateAccuracyMetrics(secondHalf);
    
    const firstPerf = this.calculatePerformanceMetrics(firstHalf);
    const secondPerf = this.calculatePerformanceMetrics(secondHalf);

    return {
      usageTrend: this.getTrendDirection(firstUsage.clickThroughRate, secondUsage.clickThroughRate),
      accuracyTrend: this.getTrendDirection(firstAccuracy.overallAccuracy, secondAccuracy.overallAccuracy),
      performanceTrend: this.getTrendDirection(
        1 / (firstPerf.averageGenerationTime + 1), // Inverse for performance (lower time = better)
        1 / (secondPerf.averageGenerationTime + 1)
      ),
    };
  }

  /**
   * Get trend direction
   */
  private getTrendDirection(first: number, second: number): 'increasing' | 'decreasing' | 'stable' {
    const threshold = 0.05; // 5% threshold for stability
    const change = (second - first) / (first || 1);
    
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Generate alerts based on metrics
   */
  private generateAlerts(metrics: DropSuggestionMetrics): void {
    const newAlerts: DropSuggestionAlert[] = [];

    // Accuracy alerts
    if (metrics.accuracy.overallAccuracy < this.config.alertThresholds.lowAccuracyThreshold) {
      newAlerts.push({
        id: `accuracy-low-${Date.now()}`,
        timestamp: Date.now(),
        severity: 'warning',
        category: 'accuracy',
        title: 'Low Suggestion Accuracy',
        message: `Overall accuracy ${(metrics.accuracy.overallAccuracy * 100).toFixed(1)}% is below threshold`,
        metric: 'overallAccuracy',
        value: metrics.accuracy.overallAccuracy,
        threshold: this.config.alertThresholds.lowAccuracyThreshold,
        recommendation: 'Review suggestion algorithm and training data',
        resolved: false,
      });
    }

    // Usage alerts
    if (metrics.usage.clickThroughRate < this.config.alertThresholds.lowUsageThreshold) {
      newAlerts.push({
        id: `usage-low-${Date.now()}`,
        timestamp: Date.now(),
        severity: 'warning',
        category: 'usage',
        title: 'Low Suggestion Engagement',
        message: `Click-through rate ${(metrics.usage.clickThroughRate * 100).toFixed(1)}% is below threshold`,
        metric: 'clickThroughRate',
        value: metrics.usage.clickThroughRate,
        threshold: this.config.alertThresholds.lowUsageThreshold,
        recommendation: 'Review suggestion relevance and UI presentation',
        resolved: false,
      });
    }

    // Performance alerts
    if (metrics.performance.averageGenerationTime > this.config.alertThresholds.slowGenerationThreshold) {
      newAlerts.push({
        id: `perf-slow-${Date.now()}`,
        timestamp: Date.now(),
        severity: 'warning',
        category: 'performance',
        title: 'Slow Suggestion Generation',
        message: `Average generation time ${metrics.performance.averageGenerationTime.toFixed(1)}ms exceeds threshold`,
        metric: 'averageGenerationTime',
        value: metrics.performance.averageGenerationTime,
        threshold: this.config.alertThresholds.slowGenerationThreshold,
        recommendation: 'Optimize suggestion algorithm or increase caching',
        resolved: false,
      });
    }

    // Error rate alerts
    if (metrics.performance.errorRate > this.config.alertThresholds.highErrorRateThreshold) {
      newAlerts.push({
        id: `error-high-${Date.now()}`,
        timestamp: Date.now(),
        severity: 'error',
        category: 'performance',
        title: 'High Error Rate',
        message: `Error rate ${(metrics.performance.errorRate * 100).toFixed(2)}% exceeds threshold`,
        metric: 'errorRate',
        value: metrics.performance.errorRate,
        threshold: this.config.alertThresholds.highErrorRateThreshold,
        recommendation: 'Investigate error sources and improve error handling',
        resolved: false,
      });
    }

    // Add new alerts (avoid duplicates)
    newAlerts.forEach(alert => {
      const existing = this.alerts.find(a => 
        a.category === alert.category && 
        a.metric === alert.metric && 
        !a.resolved
      );
      
      if (!existing) {
        this.alerts.push(alert);
      }
    });

    // Keep only recent alerts (last 100)
    this.alerts = this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100);
  }

  /**
   * Generate insights from metrics
   */
  private generateInsights(metrics: DropSuggestionMetrics): string[] {
    const insights: string[] = [];

    // Usage insights
    if (metrics.usage.acceptanceRate > 0.8) {
      insights.push('High acceptance rate suggests suggestions are well-aligned with user needs');
    } else if (metrics.usage.acceptanceRate < 0.3) {
      insights.push('Low acceptance rate indicates suggestions may not be relevant');
    }

    // Accuracy insights
    if (metrics.accuracy.confidenceVsActualCorrelation > 0.7) {
      insights.push('Strong correlation between confidence scores and actual outcomes');
    } else if (metrics.accuracy.confidenceVsActualCorrelation < 0.3) {
      insights.push('Weak correlation between confidence and outcomes - confidence calibration needed');
    }

    // Performance insights
    if (metrics.performance.cacheHitRate > 0.8) {
      insights.push('Excellent cache performance contributing to fast response times');
    } else if (metrics.performance.cacheHitRate < 0.3) {
      insights.push('Low cache hit rate may be impacting performance');
    }

    // Trend insights
    if (metrics.trends.accuracyTrend === 'improving') {
      insights.push('Suggestion accuracy is improving over time');
    } else if (metrics.trends.accuracyTrend === 'declining') {
      insights.push('Suggestion accuracy is declining - requires attention');
    }

    return insights;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(metrics: DropSuggestionMetrics, alerts: DropSuggestionAlert[]): string[] {
    const recommendations: string[] = [];

    // Accuracy recommendations
    if (metrics.accuracy.overallAccuracy < 0.7) {
      recommendations.push('Review and update suggestion algorithm weights');
      recommendations.push('Consider retraining with recent user interaction data');
    }

    // Usage recommendations
    if (metrics.usage.clickThroughRate < 0.1) {
      recommendations.push('Improve suggestion visibility and UI presentation');
      recommendations.push('Analyze user behavior to understand low engagement');
    }

    // Performance recommendations
    if (metrics.performance.averageGenerationTime > 1000) {
      recommendations.push('Implement more aggressive caching strategies');
      recommendations.push('Optimize suggestion generation algorithms');
    }

    // Alert-specific recommendations
    alerts.forEach(alert => {
      if (!alert.resolved && alert.recommendation) {
        recommendations.push(alert.recommendation);
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Helper methods for empty metrics
   */
  private createEmptyResult(timeWindowHours: number): DropSuggestionAnalyticsResult {
    return {
      metrics: this.getEmptyMetrics(timeWindowHours),
      alerts: [],
      insights: ['No data available for analysis'],
      recommendations: ['Collect more telemetry data to generate insights'],
      metadata: {
        totalEvents: 0,
        validEvents: 0,
        timeWindowHours,
        generatedAt: Date.now(),
      },
    };
  }

  private getEmptyMetrics(timeWindowHours: number): DropSuggestionMetrics {
    return {
      timeWindow: {
        start: Date.now() - (timeWindowHours * 60 * 60 * 1000),
        end: Date.now(),
        durationHours: timeWindowHours,
      },
      usage: this.getEmptyUsageMetrics(),
      accuracy: this.getEmptyAccuracyMetrics(),
      performance: this.getEmptyPerformanceMetrics(),
      trends: this.getEmptyTrends(),
    };
  }

  private getEmptyUsageMetrics() {
    return {
      totalSuggestionsGenerated: 0,
      totalSuggestionsShown: 0,
      totalSuggestionsClicked: 0,
      totalSuggestionsAccepted: 0,
      totalSuggestionsRejected: 0,
      clickThroughRate: 0,
      acceptanceRate: 0,
      rejectionRate: 0,
      averageTimeToClick: 0,
      averageTimeToAccept: 0,
    };
  }

  private getEmptyAccuracyMetrics() {
    return {
      successPredictionAccuracy: 0,
      yieldPredictionAccuracy: 0,
      riskPredictionAccuracy: 0,
      overallAccuracy: 0,
      confidenceVsActualCorrelation: 0,
      averageConfidence: 0,
    };
  }

  private getEmptyPerformanceMetrics() {
    return {
      averageGenerationTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      memoryUsage: 0,
      algorithmEfficiency: 0,
    };
  }

  private getEmptyTrends() {
    return {
      usageTrend: 'stable' as const,
      accuracyTrend: 'stable' as const,
      performanceTrend: 'stable' as const,
    };
  }

  /**
   * Get suggestion confidence from events
   */
  private getSuggestionConfidence(suggestionId: string, events: DropAITelemetryEvent[]): number | null {
    const shownEvent = events.find(
      e => e.eventType === 'suggestion_shown' && e.data.suggestionId === suggestionId
    ) as SuggestionShownEvent;

    return shownEvent?.data.confidence ?? null;
  }

  /**
   * Calculate correlation between two arrays
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Get current alerts
   */
  getAlerts(): DropSuggestionAlert[] {
    return [...this.alerts];
  }

  /**
   * Mark alert as resolved
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get event history statistics
   */
  getEventStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    timeRange: { start: number; end: number };
  } {
    const eventsByType: Record<string, number> = {};
    
    this.eventHistory.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    });

    const timestamps = this.eventHistory.map(e => e.timestamp);
    const timeRange = {
      start: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      end: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      timeRange,
    };
  }
}

/**
 * Create analytics instance with default configuration
 */
export function createDropTelemetryAnalytics(
  config?: Partial<IdleVillageDropTelemetryConfig>
): IdleVillageDropTelemetryAnalytics {
  return new IdleVillageDropTelemetryAnalytics(config);
}
