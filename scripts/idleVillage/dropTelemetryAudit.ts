/**
 * Idle Village Drop Suggestion Telemetry Auditor
 * 
 * Comprehensive audit script for AI drop suggestion telemetry.
 * Compares usage vs accuracy metrics and generates alerts for
 * performance issues and optimization opportunities.
 * 
 * @module scripts/idleVillage/dropTelemetryAudit
 * @since NP-106
 * @author Sentinel-Drop – Telemetry Audit
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
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
 * Audit configuration
 */
export interface DropTelemetryAuditConfig {
  /** Time window for audit (in hours) */
  timeWindowHours: number;
  /** Minimum number of events for meaningful analysis */
  minEventThreshold: number;
  /** Accuracy thresholds for alerts */
  accuracyThresholds: {
    lowAccuracy: number;      // Below this triggers accuracy alert
    criticalAccuracy: number; // Below this triggers critical alert
  };
  /** Usage thresholds for alerts */
  usageThresholds: {
    lowUsage: number;         // Below this triggers usage alert
    highUsage: number;        // Above this triggers performance alert
  };
  /** Output directory for reports */
  outputDir: string;
}

/**
 * Audit metrics and insights
 */
export interface DropTelemetryAuditResults {
  /** Audit metadata */
  metadata: {
    auditTimestamp: number;
    timeWindowHours: number;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
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
  };
  /** Accuracy metrics */
  accuracy: {
    successPredictionAccuracy: number;
    yieldPredictionAccuracy: number;
    riskPredictionAccuracy: number;
    overallAccuracy: number;
    confidenceVsActualCorrelation: number;
  };
  /** Performance metrics */
  performance: {
    averageGenerationTime: number;
    averageTimeToClick: number;
    averageTimeToAccept: number;
    cacheHitRate: number;
    errorRate: number;
  };
  /** Generated alerts */
  alerts: Array<{
    severity: 'info' | 'warning' | 'error' | 'critical';
    type: 'accuracy' | 'usage' | 'performance' | 'data_quality';
    message: string;
    metric: string;
    value: number;
    threshold: number;
    recommendation?: string;
  }>;
  /** Detailed breakdowns */
  breakdowns: {
    bySuggestionType: Record<string, {
      count: number;
      accuracy: number;
      usage: number;
    }>;
    byPriority: Record<string, {
      count: number;
      accuracy: number;
      usage: number;
    }>;
    byTimeOfDay: Record<string, {
      count: number;
      accuracy: number;
    }>;
  };
}

/**
 * Default audit configuration
 */
const DEFAULT_AUDIT_CONFIG: DropTelemetryAuditConfig = {
  timeWindowHours: 24,
  minEventThreshold: 50,
  accuracyThresholds: {
    lowAccuracy: 0.7,
    criticalAccuracy: 0.5,
  },
  usageThresholds: {
    lowUsage: 0.1,  // 10% click-through rate
    highUsage: 0.8, // 80% acceptance rate might indicate too easy suggestions
  },
  outputDir: './test-results/drop-telemetry-audit',
};

/**
 * Drop Suggestion Telemetry Auditor
 */
export class DropTelemetryAuditor {
  private config: DropTelemetryAuditConfig;
  private events: DropAITelemetryEvent[] = [];

  constructor(config: Partial<DropTelemetryAuditConfig> = {}) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };
    
    // Ensure output directory exists
    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Load telemetry events from file
   */
  loadEvents(filePath: string): boolean {
    try {
      if (!existsSync(filePath)) {
        console.error(`Telemetry file not found: ${filePath}`);
        return false;
      }

      const data = readFileSync(filePath, 'utf-8');
      const events = JSON.parse(data) as DropAITelemetryEvent[];
      
      // Validate and filter events
      this.events = events.filter(event => this.isValidEvent(event));
      
      console.log(`Loaded ${this.events.length} valid events from ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Failed to load events from ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Validate telemetry event structure
   */
  private isValidEvent(event: any): event is DropAITelemetryEvent {
    return (
      event &&
      typeof event.eventType === 'string' &&
      typeof event.timestamp === 'number' &&
      typeof event.sessionId === 'string' &&
      typeof event.data === 'object'
    );
  }

  /**
   * Run comprehensive audit
   */
  runAudit(): DropTelemetryAuditResults {
    const now = Date.now();
    const timeWindowMs = this.config.timeWindowHours * 60 * 60 * 1000;
    
    // Filter events by time window
    const recentEvents = this.events.filter(
      event => now - event.timestamp <= timeWindowMs
    );

    if (recentEvents.length < this.config.minEventThreshold) {
      throw new Error(
        `Insufficient events for audit: ${recentEvents.length} (minimum: ${this.config.minEventThreshold})`
      );
    }

    // Calculate metrics
    const usage = this.calculateUsageMetrics(recentEvents);
    const accuracy = this.calculateAccuracyMetrics(recentEvents);
    const performance = this.calculatePerformanceMetrics(recentEvents);
    const alerts = this.generateAlerts(usage, accuracy, performance);
    const breakdowns = this.calculateBreakdowns(recentEvents);

    return {
      metadata: {
        auditTimestamp: now,
        timeWindowHours: this.config.timeWindowHours,
        totalEvents: this.events.length,
        validEvents: recentEvents.length,
        invalidEvents: this.events.length - recentEvents.length,
      },
      usage,
      accuracy,
      performance,
      alerts,
      breakdowns,
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

    const clickThroughRate = shown > 0 ? clicked / shown : 0;
    const acceptanceRate = clicked > 0 ? accepted / clicked : 0;
    const rejectionRate = clicked > 0 ? rejected / clicked : 0;

    return {
      totalSuggestionsGenerated: generated,
      totalSuggestionsShown: shown,
      totalSuggestionsClicked: clicked,
      totalSuggestionsAccepted: accepted,
      totalSuggestionsRejected: rejected,
      clickThroughRate,
      acceptanceRate,
      rejectionRate,
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
      return {
        successPredictionAccuracy: 0,
        yieldPredictionAccuracy: 0,
        riskPredictionAccuracy: 0,
        overallAccuracy: 0,
        confidenceVsActualCorrelation: 0,
      };
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

    return {
      successPredictionAccuracy: successAccuracy,
      yieldPredictionAccuracy: yieldAccuracy,
      riskPredictionAccuracy: riskAccuracy,
      overallAccuracy: (successAccuracy + yieldAccuracy + riskAccuracy) / 3,
      confidenceVsActualCorrelation: correlation,
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(events: DropAITelemetryEvent[]) {
    const generated = events.filter(
      (e): e is SuggestionsGeneratedEvent => e.eventType === 'suggestions_generated'
    );
    const clicked = events.filter(
      (e): e is SuggestionClickedEvent => e.eventType === 'suggestion_clicked'
    );
    const accepted = events.filter(
      (e): e is SuggestionAcceptedEvent => e.eventType === 'suggestion_accepted'
    );
    const performance = events.filter(
      (e): e is AIPerformanceMetricsEvent => e.eventType === 'ai_performance_metrics'
    );

    const avgGenerationTime = generated.length > 0
      ? generated.reduce((sum, e) => sum + e.data.generationTimeMs, 0) / generated.length
      : 0;

    const avgTimeToClick = clicked.length > 0
      ? clicked.reduce((sum, e) => sum + e.data.timeToClick, 0) / clicked.length
      : 0;

    const avgTimeToAccept = accepted.length > 0
      ? accepted.reduce((sum, e) => sum + e.data.timeToAccept, 0) / accepted.length
      : 0;

    const cacheHitRate = generated.length > 0
      ? generated.filter(e => e.data.cacheHit).length / generated.length
      : 0;

    const errorRate = events.filter(e => e.eventType === 'error_occurred').length / events.length;

    return {
      averageGenerationTime: avgGenerationTime,
      averageTimeToClick: avgTimeToClick,
      averageTimeToAccept: avgTimeToAccept,
      cacheHitRate,
      errorRate,
    };
  }

  /**
   * Generate alerts based on metrics
   */
  private generateAlerts(
    usage: DropTelemetryAuditResults['usage'],
    accuracy: DropTelemetryAuditResults['accuracy'],
    performance: DropTelemetryAuditResults['performance']
  ) {
    const alerts: DropTelemetryAuditResults['alerts'] = [];

    // Accuracy alerts
    if (accuracy.overallAccuracy < this.config.accuracyThresholds.criticalAccuracy) {
      alerts.push({
        severity: 'critical',
        type: 'accuracy',
        message: 'Critical accuracy drop detected',
        metric: 'overallAccuracy',
        value: accuracy.overallAccuracy,
        threshold: this.config.accuracyThresholds.criticalAccuracy,
        recommendation: 'Review suggestion algorithm and training data',
      });
    } else if (accuracy.overallAccuracy < this.config.accuracyThresholds.lowAccuracy) {
      alerts.push({
        severity: 'warning',
        type: 'accuracy',
        message: 'Low accuracy detected',
        metric: 'overallAccuracy',
        value: accuracy.overallAccuracy,
        threshold: this.config.accuracyThresholds.lowAccuracy,
        recommendation: 'Consider adjusting suggestion weights or thresholds',
      });
    }

    // Usage alerts
    if (usage.clickThroughRate < this.config.usageThresholds.lowUsage) {
      alerts.push({
        severity: 'warning',
        type: 'usage',
        message: 'Low suggestion engagement',
        metric: 'clickThroughRate',
        value: usage.clickThroughRate,
        threshold: this.config.usageThresholds.lowUsage,
        recommendation: 'Review suggestion relevance and UI presentation',
      });
    }

    if (usage.acceptanceRate > this.config.usageThresholds.highUsage) {
      alerts.push({
        severity: 'info',
        type: 'usage',
        message: 'Very high acceptance rate',
        metric: 'acceptanceRate',
        value: usage.acceptanceRate,
        threshold: this.config.usageThresholds.highUsage,
        recommendation: 'Suggestions may be too obvious; consider increasing challenge',
      });
    }

    // Performance alerts
    if (performance.averageGenerationTime > 1000) {
      alerts.push({
        severity: 'warning',
        type: 'performance',
        message: 'Slow suggestion generation',
        metric: 'averageGenerationTime',
        value: performance.averageGenerationTime,
        threshold: 1000,
        recommendation: 'Optimize suggestion algorithm or increase caching',
      });
    }

    if (performance.cacheHitRate < 0.3) {
      alerts.push({
        severity: 'info',
        type: 'performance',
        message: 'Low cache hit rate',
        metric: 'cacheHitRate',
        value: performance.cacheHitRate,
        threshold: 0.3,
        recommendation: 'Review caching strategy and key generation',
      });
    }

    if (performance.errorRate > 0.05) {
      alerts.push({
        severity: 'error',
        type: 'performance',
        message: 'High error rate',
        metric: 'errorRate',
        value: performance.errorRate,
        threshold: 0.05,
        recommendation: 'Investigate error sources and improve error handling',
      });
    }

    return alerts;
  }

  /**
   * Calculate detailed breakdowns
   */
  private calculateBreakdowns(events: DropAITelemetryEvent[]) {
    const byType: Record<string, { count: number; accuracy: number; usage: number }> = {};
    const byPriority: Record<string, { count: number; accuracy: number; usage: number }> = {};
    const byTimeOfDay: Record<string, { count: number; accuracy: number }> = {};

    // Initialize breakdowns
    const shownEvents = events.filter(e => e.eventType === 'suggestion_shown');
    const acceptedEvents = events.filter(e => e.eventType === 'suggestion_accepted');

    shownEvents.forEach(event => {
      const hour = new Date(event.timestamp).getHours().toString();
      byTimeOfDay[hour] = byTimeOfDay[hour] || { count: 0, accuracy: 0 };
      byTimeOfDay[hour].count++;
    });

    acceptedEvents.forEach(event => {
      const hour = new Date(event.timestamp).getHours().toString();
      if (byTimeOfDay[hour]) {
        byTimeOfDay[hour].accuracy += event.data.suggestionAccuracy?.successPredictionAccurate ? 1 : 0;
      }
    });

    // Calculate accuracy percentages
    Object.keys(byTimeOfDay).forEach(hour => {
      const data = byTimeOfDay[hour];
      data.accuracy = data.count > 0 ? data.accuracy / data.count : 0;
    });

    return {
      bySuggestionType: byType,
      byPriority: byPriority,
      byTimeOfDay,
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
   * Save audit report to file
   */
  saveReport(results: DropTelemetryAuditResults, filename?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFilename = filename || `drop-telemetry-audit-${timestamp}.json`;
    const reportPath = join(this.config.outputDir, reportFilename);

    const report = {
      ...results,
      auditConfig: this.config,
      generatedAt: new Date().toISOString(),
    };

    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Audit report saved to: ${reportPath}`);

    return reportPath;
  }

  /**
   * Print summary to console
   */
  printSummary(results: DropTelemetryAuditResults): void {
    console.log('\n=== Drop Suggestion Telemetry Audit Summary ===');
    console.log(`Time Window: ${results.metadata.timeWindowHours}h`);
    console.log(`Events Analyzed: ${results.metadata.validEvents}`);
    
    console.log('\n--- Usage Metrics ---');
    console.log(`Click-Through Rate: ${(results.usage.clickThroughRate * 100).toFixed(1)}%`);
    console.log(`Acceptance Rate: ${(results.usage.acceptanceRate * 100).toFixed(1)}%`);
    console.log(`Rejection Rate: ${(results.usage.rejectionRate * 100).toFixed(1)}%`);
    
    console.log('\n--- Accuracy Metrics ---');
    console.log(`Overall Accuracy: ${(results.accuracy.overallAccuracy * 100).toFixed(1)}%`);
    console.log(`Success Prediction: ${(results.accuracy.successPredictionAccuracy * 100).toFixed(1)}%`);
    console.log(`Confidence Correlation: results.accuracy.confidenceVsActualCorrelation.toFixed(3)`);
    
    console.log('\n--- Performance Metrics ---');
    console.log(`Avg Generation Time: ${results.performance.averageGenerationTime.toFixed(1)}ms`);
    console.log(`Cache Hit Rate: ${(results.performance.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`Error Rate: ${(results.performance.errorRate * 100).toFixed(2)}%`);
    
    if (results.alerts.length > 0) {
      console.log('\n--- Alerts ---');
      results.alerts.forEach(alert => {
        console.log(`${alert.severity.toUpperCase()}: ${alert.message}`);
        if (alert.recommendation) {
          console.log(`  Recommendation: ${alert.recommendation}`);
        }
      });
    } else {
      console.log('\n--- No alerts generated ---');
    }
    
    console.log('\n=====================================\n');
  }
}

/**
 * Run audit with default configuration
 */
export async function runDropTelemetryAudit(
  telemetryFilePath: string,
  config?: Partial<DropTelemetryAuditConfig>
): Promise<DropTelemetryAuditResults> {
  const auditor = new DropTelemetryAuditor(config);
  
  console.log('Starting Drop Suggestion Telemetry Audit...');
  
  if (!auditor.loadEvents(telemetryFilePath)) {
    throw new Error(`Failed to load telemetry from: ${telemetryFilePath}`);
  }
  
  const results = auditor.runAudit();
  auditor.printSummary(results);
  auditor.saveReport(results);
  
  return results;
}

// CLI entry point
if (require.main === module) {
  const telemetryFile = process.argv[2];
  if (!telemetryFile) {
    console.error('Usage: tsx dropTelemetryAudit.ts <telemetry-file.json>');
    process.exit(1);
  }
  
  runDropTelemetryAudit(telemetryFile).catch(error => {
    console.error('Audit failed:', error);
    process.exit(1);
  });
}
