/**
 * Activity Slot Telemetry Aggregation and Analysis Utilities
 * 
 * Provides utilities for aggregating, analyzing, and generating insights
 * from activity slot telemetry data. Includes performance analysis,
 * error pattern detection, and usage statistics.
 * 
 * @since NP-016
 */

import type { ActivitySlotTelemetryEvent, ActivitySlotEventType } from '../activitySlotTelemetryMapper';

/**
 * Aggregated telemetry statistics
 */
export interface TelemetryAggregation {
  /** Total number of events */
  totalEvents: number;
  /** Events by type */
  eventsByType: Record<ActivitySlotEventType, number>;
  /** Events by slot */
  eventsBySlot: Record<string, number>;
  /** Events by session */
  eventsBySession: Record<string, number>;
  /** Time range */
  timeRange: {
    startTime: number;
    endTime: number;
    duration: number;
  };
  /** Performance metrics */
  performanceMetrics: PerformanceAggregation;
  /** Error analysis */
  errorAnalysis: ErrorAggregation;
  /** Usage patterns */
  usagePatterns: UsagePatternAggregation;
}

/**
 * Performance aggregation metrics
 */
export interface PerformanceAggregation {
  /** Validation time statistics */
  validationTime: {
    average: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  /** Render time statistics */
  renderTime: {
    average: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  /** Drag operation statistics */
  dragOperations: {
    averageDuration: number;
    successRate: number;
    cancelRate: number;
    totalOperations: number;
  };
  /** Assignment statistics */
  assignments: {
    totalAssignments: number;
    successRate: number;
    failureRate: number;
    averageProcessingTime: number;
  };
}

/**
 * Error aggregation analysis
 */
export interface ErrorAggregation {
  /** Total error count */
  totalErrors: number;
  /** Error rate (errors / total operations) */
  errorRate: number;
  /** Errors by type */
  errorsByType: Record<string, number>;
  /** Errors by slot */
  errorsBySlot: Record<string, number>;
  /** Errors by failure reason */
  errorsByReason: Record<string, number>;
  /** Most common errors */
  topErrors: Array<{
    type: string;
    count: number;
    percentage: number;
    description?: string;
  }>;
  /** Error trends */
  errorTrends: {
    increasingErrors: string[];
    decreasingErrors: string[];
    stableErrors: string[];
  };
}

/**
 * Usage pattern aggregation
 */
export interface UsagePatternAggregation {
  /** Most active slots */
  topSlots: Array<{
    slotId: string;
    eventCount: number;
    percentage: number;
  }>;
  /** Peak usage times */
  peakUsageTimes: Array<{
    hour: number;
    eventCount: number;
    percentage: number;
  }>;
  /** Interaction patterns */
  interactionPatterns: {
    dragDropUsage: number;
    clickAssignUsage: number;
    autoAssignUsage: number;
    batchOperationUsage: number;
  };
  /** Session statistics */
  sessionStats: {
    averageSessionDuration: number;
    averageEventsPerSession: number;
    totalSessions: number;
  };
}

/**
 * Telemetry analysis configuration
 */
export interface TelemetryAnalysisConfig {
  /** Time window for analysis (in milliseconds) */
  timeWindow?: number;
  /** Percentiles to calculate */
  percentiles?: number[];
  /** Top N items to include in rankings */
  topN?: number;
  /** Minimum events required for analysis */
  minEvents?: number;
  /** Whether to include detailed breakdowns */
  includeDetails?: boolean;
}

/**
 * Default analysis configuration
 */
export const DEFAULT_TELEMETRY_ANALYSIS_CONFIG: TelemetryAnalysisConfig = {
  timeWindow: 24 * 60 * 60 * 1000, // 24 hours
  percentiles: [50, 90, 95, 99],
  topN: 10,
  minEvents: 10,
  includeDetails: true,
};

/**
 * Aggregates telemetry events into comprehensive statistics
 */
export function aggregateTelemetryEvents(
  events: ActivitySlotTelemetryEvent[],
  config: TelemetryAnalysisConfig = {}
): TelemetryAggregation {
  const finalConfig = { ...DEFAULT_TELEMETRY_ANALYSIS_CONFIG, ...config };
  
  // Filter events by time window if specified
  const filteredEvents = finalConfig.timeWindow
    ? events.filter(event => 
        Date.now() - event.timestamp <= finalConfig.timeWindow!
      )
    : events;

  if (filteredEvents.length < finalConfig.minEvents) {
    throw new Error(`Insufficient events for analysis: ${filteredEvents.length} < ${finalConfig.minEvents}`);
  }

  // Basic aggregation
  const eventsByType = aggregateByType(filteredEvents);
  const eventsBySlot = aggregateBySlot(filteredEvents);
  const eventsBySession = aggregateBySession(filteredEvents);
  const timeRange = calculateTimeRange(filteredEvents);

  // Performance aggregation
  const performanceMetrics = aggregatePerformanceMetrics(filteredEvents, finalConfig);

  // Error analysis
  const errorAnalysis = aggregateErrorAnalysis(filteredEvents, finalConfig);

  // Usage patterns
  const usagePatterns = aggregateUsagePatterns(filteredEvents, finalConfig);

  return {
    totalEvents: filteredEvents.length,
    eventsByType,
    eventsBySlot,
    eventsBySession,
    timeRange,
    performanceMetrics,
    errorAnalysis,
    usagePatterns,
  };
}

/**
 * Aggregates events by type
 */
function aggregateByType(events: ActivitySlotTelemetryEvent[]): Record<ActivitySlotEventType, number> {
  const aggregation: Partial<Record<ActivitySlotEventType, number>> = {};
  
  events.forEach(event => {
    aggregation[event.type] = (aggregation[event.type] || 0) + 1;
  });
  
  return aggregation as Record<ActivitySlotEventType, number>;
}

/**
 * Aggregates events by slot
 */
function aggregateBySlot(events: ActivitySlotTelemetryEvent[]): Record<string, number> {
  const aggregation: Record<string, number> = {};
  
  events.forEach(event => {
    aggregation[event.slotId] = (aggregation[event.slotId] || 0) + 1;
  });
  
  return aggregation;
}

/**
 * Aggregates events by session
 */
function aggregateBySession(events: ActivitySlotTelemetryEvent[]): Record<string, number> {
  const aggregation: Record<string, number> = {};
  
  events.forEach(event => {
    aggregation[event.sessionId] = (aggregation[event.sessionId] || 0) + 1;
  });
  
  return aggregation;
}

/**
 * Calculates time range for events
 */
function calculateTimeRange(events: ActivitySlotTelemetryEvent[]): TelemetryAggregation['timeRange'] {
  if (events.length === 0) {
    return {
      startTime: 0,
      endTime: 0,
      duration: 0,
    };
  }

  const timestamps = events.map(event => event.timestamp);
  const startTime = Math.min(...timestamps);
  const endTime = Math.max(...timestamps);

  return {
    startTime,
    endTime,
    duration: endTime - startTime,
  };
}

/**
 * Aggregates performance metrics from events
 */
function aggregatePerformanceMetrics(
  events: ActivitySlotTelemetryEvent[],
  config: TelemetryAnalysisConfig
): PerformanceAggregation {
  const validationTimes: number[] = [];
  const renderTimes: number[] = [];
  const dragDurations: number[] = [];
  const assignmentTimes: number[] = [];
  let successfulAssignments = 0;
  let failedAssignments = 0;
  let successfulDrags = 0;
  let cancelledDrags = 0;

  events.forEach(event => {
    switch (event.type) {
      case 'performance_metric': {
        const payload = event.payload as any;
        if (payload.metricType === 'validation_time') {
          validationTimes.push(payload.value);
        } else if (payload.metricType === 'render_time') {
          renderTimes.push(payload.value);
        }
        break;
      }

      case 'drag_complete': {
        const dragComplete = event.payload as any;
        dragDurations.push(dragComplete.operationDuration);
        if (dragComplete.successMetrics.wasSuccessful) {
          successfulDrags++;
        }
        break;
      }

      case 'drag_cancel': {
        cancelledDrags++;
        break;
      }

      case 'resident_assign': {
        const assignPayload = event.payload as any;
        assignmentTimes.push(assignPayload.assignmentMetrics.processingTime);
        successfulAssignments++;
        break;
      }

      case 'assign_failure': {
        failedAssignments++;
        break;
      }
    }
  });

  return {
    validationTime: calculatePercentiles(validationTimes, config.percentiles),
    renderTime: calculatePercentiles(renderTimes, config.percentiles),
    dragOperations: {
      averageDuration: dragDurations.length > 0 ? dragDurations.reduce((a, b) => a + b, 0) / dragDurations.length : 0,
      successRate: dragDurations.length > 0 ? successfulDrags / (successfulDrags + cancelledDrags) : 0,
      cancelRate: dragDurations.length > 0 ? cancelledDrags / (successfulDrags + cancelledDrags) : 0,
      totalOperations: successfulDrags + cancelledDrags,
    },
    assignments: {
      totalAssignments: successfulAssignments + failedAssignments,
      successRate: (successfulAssignments + failedAssignments) > 0 ? successfulAssignments / (successfulAssignments + failedAssignments) : 0,
      failureRate: (successfulAssignments + failedAssignments) > 0 ? failedAssignments / (successfulAssignments + failedAssignments) : 0,
      averageProcessingTime: assignmentTimes.length > 0 ? assignmentTimes.reduce((a, b) => a + b, 0) / assignmentTimes.length : 0,
    },
  };
}

/**
 * Aggregates error analysis from events
 */
function aggregateErrorAnalysis(
  events: ActivitySlotTelemetryEvent[],
  config: TelemetryAnalysisConfig
): ErrorAggregation {
  const errorEvents = events.filter(event => 
    event.type === 'assign_failure' || 
    event.type === 'drag_cancel' ||
    (event.type === 'validation_check' && !(event.payload as any).validationResult.isValid)
  );

  const errorsByType: Record<string, number> = {};
  const errorsBySlot: Record<string, number> = {};
  const errorsByReason: Record<string, number> = {};

  errorEvents.forEach(event => {
    errorsByType[event.type] = (errorsByType[event.type] || 0) + 1;
    errorsBySlot[event.slotId] = (errorsBySlot[event.slotId] || 0) + 1;

    if (event.type === 'assign_failure') {
      const payload = event.payload as any;
      const reason = payload.failureReason || 'unknown';
      errorsByReason[reason] = (errorsByReason[reason] || 0) + 1;
    } else if (event.type === 'drag_cancel') {
      const payload = event.payload as any;
      const reason = payload.cancelReason || 'unknown';
      errorsByReason[reason] = (errorsByReason[reason] || 0) + 1;
    }
  });

  // Calculate top errors
  const topErrors = Object.entries(errorsByReason)
    .map(([reason, count]) => ({
      type: reason,
      count,
      percentage: (count / errorEvents.length) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, config.topN);

  // Calculate error trends (simplified - would need more data for real trends)
  const errorTrends = {
    increasingErrors: Object.keys(errorsByType).filter(type => errorsByType[type] > 5),
    decreasingErrors: [] as string[], // Would need historical data
    stableErrors: Object.keys(errorsByType).filter(type => errorsByType[type] <= 5),
  };

  return {
    totalErrors: errorEvents.length,
    errorRate: events.length > 0 ? errorEvents.length / events.length : 0,
    errorsByType,
    errorsBySlot,
    errorsByReason,
    topErrors,
    errorTrends,
  };
}

/**
 * Aggregates usage patterns from events
 */
function aggregateUsagePatterns(
  events: ActivitySlotTelemetryEvent[],
  config: TelemetryAnalysisConfig
): UsagePatternAggregation {
  // Top slots
  const topSlots = Object.entries(aggregateBySlot(events))
    .map(([slotId, count]) => ({
      slotId,
      eventCount: count,
      percentage: (count / events.length) * 100,
    }))
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, config.topN);

  // Peak usage times (by hour)
  const eventsByHour: Record<number, number> = {};
  events.forEach(event => {
    const hour = new Date(event.timestamp).getHours();
    eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
  });

  const peakUsageTimes = Object.entries(eventsByHour)
    .map(([hour, count]) => ({
      hour: parseInt(hour),
      eventCount: count,
      percentage: (count / events.length) * 100,
    }))
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, config.topN);

  // Interaction patterns
  const interactionPatterns = {
    dragDropUsage: events.filter(e => e.context.interactionType === 'drag_drop').length,
    clickAssignUsage: events.filter(e => e.context.interactionType === 'click_assign').length,
    autoAssignUsage: events.filter(e => e.context.interactionType === 'auto_assign').length,
    batchOperationUsage: events.filter(e => e.context.interactionType === 'batch_operation').length,
  };

  // Session statistics
  const sessionEvents = aggregateBySession(events);
  const sessionDurations: number[] = [];
  
  // Group events by session and calculate durations
  const eventsBySessionGrouped: Record<string, ActivitySlotTelemetryEvent[]> = {};
  events.forEach(event => {
    if (!eventsBySessionGrouped[event.sessionId]) {
      eventsBySessionGrouped[event.sessionId] = [];
    }
    eventsBySessionGrouped[event.sessionId].push(event);
  });

  Object.values(eventsBySessionGrouped).forEach(sessionEvents => {
    if (sessionEvents.length > 1) {
      const timestamps = sessionEvents.map(e => e.timestamp);
      const duration = Math.max(...timestamps) - Math.min(...timestamps);
      sessionDurations.push(duration);
    }
  });

  const sessionStats = {
    averageSessionDuration: sessionDurations.length > 0 ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length : 0,
    averageEventsPerSession: Object.keys(sessionEvents).length > 0 ? events.length / Object.keys(sessionEvents).length : 0,
    totalSessions: Object.keys(sessionEvents).length,
  };

  return {
    topSlots,
    peakUsageTimes,
    interactionPatterns,
    sessionStats,
  };
}

/**
 * Calculates percentiles for an array of numbers
 */
function calculatePercentiles(values: number[], percentiles: number[]): {
  average: number;
  min: number;
  max: number;
  [key: string]: number;
} {
  if (values.length === 0) {
    const result: any = { average: 0, min: 0, max: 0 };
    percentiles.forEach(p => result[`p${p}`] = 0);
    return result;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const result: any = { average, min, max };
  
  percentiles.forEach(percentile => {
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    result[`p${percentile}`] = sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  });

  return result;
}

/**
 * Generates insights from telemetry aggregation
 */
export function generateTelemetryInsights(
  aggregation: TelemetryAggregation,
  config: TelemetryAnalysisConfig = {}
): TelemetryInsights {
  const insights: TelemetryInsights = {
    performanceInsights: [],
    errorInsights: [],
    usageInsights: [],
    recommendations: [],
    overallHealth: 'good',
  };

  // Performance insights
  if (aggregation.performanceMetrics.validationTime.p95 > 100) {
    insights.performanceInsights.push({
      type: 'warning',
      message: 'Validation time P95 is above 100ms',
      metric: 'validation_time_p95',
      value: aggregation.performanceMetrics.validationTime.p95,
      threshold: 100,
    });
  }

  if (aggregation.performanceMetrics.dragOperations.successRate < 0.8) {
    insights.performanceInsights.push({
      type: 'error',
      message: 'Drag operation success rate is below 80%',
      metric: 'drag_success_rate',
      value: aggregation.performanceMetrics.dragOperations.successRate,
      threshold: 0.8,
    });
  }

  // Error insights
  if (aggregation.errorAnalysis.errorRate > 0.1) {
    insights.errorInsights.push({
      type: 'error',
      message: 'Error rate is above 10%',
      metric: 'error_rate',
      value: aggregation.errorAnalysis.errorRate,
      threshold: 0.1,
    });
  }

  // Usage insights
  const topSlot = aggregation.usagePatterns.topSlots[0];
  if (topSlot && topSlot.percentage > 50) {
    insights.usageInsights.push({
      type: 'info',
      message: `Slot ${topSlot.slotId} accounts for ${topSlot.percentage.toFixed(1)}% of all events`,
      metric: 'slot_concentration',
      value: topSlot.percentage,
      threshold: 50,
    });
  }

  // Generate recommendations
  insights.recommendations = generateRecommendations(insights);

  // Determine overall health
  insights.overallHealth = determineOverallHealth(insights);

  return insights;
}

/**
 * Telemetry insights
 */
export interface TelemetryInsights {
  /** Performance-related insights */
  performanceInsights: Insight[];
  /** Error-related insights */
  errorInsights: Insight[];
  /** Usage-related insights */
  usageInsights: Insight[];
  /** Actionable recommendations */
  recommendations: Recommendation[];
  /** Overall system health */
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Individual insight
 */
export interface Insight {
  type: 'info' | 'warning' | 'error';
  message: string;
  metric: string;
  value: number;
  threshold: number;
}

/**
 * Actionable recommendation
 */
export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'performance' | 'error_handling' | 'user_experience' | 'infrastructure';
  title: string;
  description: string;
  actionItems: string[];
}

/**
 * Generates actionable recommendations from insights
 */
function generateRecommendations(insights: TelemetryInsights): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Performance recommendations
  insights.performanceInsights.forEach(insight => {
    if (insight.metric === 'validation_time_p95' && insight.type === 'warning') {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: 'Optimize Validation Performance',
        description: 'Validation times are exceeding acceptable thresholds',
        actionItems: [
          'Review validation logic for optimization opportunities',
          'Consider caching validation results',
          'Implement validation debouncing for rapid operations',
        ],
      });
    }

    if (insight.metric === 'drag_success_rate' && insight.type === 'error') {
      recommendations.push({
        priority: 'high',
        category: 'user_experience',
        title: 'Improve Drag Operation Success Rate',
        description: 'Users are experiencing high failure rates with drag operations',
        actionItems: [
          'Review drag validation logic',
          'Improve visual feedback for invalid operations',
          'Add pre-validation hints to prevent invalid attempts',
        ],
      });
    }
  });

  // Error recommendations
  insights.errorInsights.forEach(insight => {
    if (insight.metric === 'error_rate' && insight.type === 'error') {
      recommendations.push({
        priority: 'high',
        category: 'error_handling',
        title: 'Reduce High Error Rate',
        description: 'System error rate is above acceptable thresholds',
        actionItems: [
          'Analyze top error types and root causes',
          'Implement better error prevention',
          'Add user guidance for common error scenarios',
        ],
      });
    }
  });

  return recommendations;
}

/**
 * Determines overall system health from insights
 */
function determineOverallHealth(insights: TelemetryInsights): TelemetryInsights['overallHealth'] {
  const errorCount = insights.errorInsights.filter(i => i.type === 'error').length;
  const warningCount = insights.performanceInsights.filter(i => i.type === 'warning').length +
                      insights.errorInsights.filter(i => i.type === 'warning').length;

  if (errorCount > 0) return 'poor';
  if (warningCount > 2) return 'fair';
  if (warningCount > 0) return 'good';
  return 'excellent';
}

/**
 * Exports telemetry aggregation to CSV format
 */
export function exportTelemetryToCSV(aggregation: TelemetryAggregation): string {
  const headers = [
    'Metric',
    'Value',
    'Category',
    'Subcategory',
  ];

  const rows: string[][] = [headers];

  // Performance metrics
  Object.entries(aggregation.performanceMetrics.validationTime).forEach(([metric, value]) => {
    rows.push(['validation_time', value.toString(), 'performance', 'validation']);
  });

  Object.entries(aggregation.performanceMetrics.renderTime).forEach(([metric, value]) => {
    rows.push(['render_time', value.toString(), 'performance', 'render']);
  });

  // Error metrics
  rows.push(['total_errors', aggregation.errorAnalysis.totalErrors.toString(), 'errors', 'summary']);
  rows.push(['error_rate', aggregation.errorAnalysis.errorRate.toString(), 'errors', 'summary']);

  // Usage metrics
  aggregation.usagePatterns.topSlots.forEach((slot, index) => {
    rows.push([`top_slot_${index + 1}`, slot.eventCount.toString(), 'usage', 'slots']);
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Exports telemetry aggregation to JSON format
 */
export function exportTelemetryToJSON(aggregation: TelemetryAggregation): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    aggregation,
    insights: generateTelemetryInsights(aggregation),
  }, null, 2);
}
