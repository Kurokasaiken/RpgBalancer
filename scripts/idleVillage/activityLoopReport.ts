#!/usr/bin/env tsx

/**
 * Idle Village Activity Loop Report CLI Script
 * 
 * Generates activity loop bottleneck analysis reports in JSON, CSV, and markdown formats.
 * Saves reports to test-results/ directory with timestamped filenames.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createSandboxDiagnostics } from '../../src/ui/idleVillage/utils/sandboxDiagnostics';
import {
  DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG,
  ActivityLoopEvent,
  ActivityBottleneck,
  ActivityLoopMetrics,
} from '../../src/ui/idleVillage/analytics/activityLoopAnalyzerConfig';

const diagnostics = createSandboxDiagnostics('ActivityLoopReportCLI', 'idleVillage');

/**
 * Sample activity loop data for demonstration
 */
const SAMPLE_ACTIVITY_LOOP_DATA: ActivityLoopEvent[] = Array.from({ length: 2000 }, (_, i) => {
  const types: ActivityLoopEvent['type'][] = ['activityStarted', 'activityCompleted', 'activityFailed', 'activityCancelled'];
  const activityTypes = ['job', 'quest', 'maintenance', 'exploration'] as const;
  
  return {
    id: `event-${i}`,
    type: types[Math.floor(Math.random() * types.length)],
    timestamp: Date.now() - (2000 - i) * 60000, // One event per minute for last ~33 hours
    activityId: `activity-${(i % 25) + 1}`,
    activityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
    crewId: `crew-${(i % 10) + 1}`,
    sessionId: `session-${Math.floor(i / 100)}`,
    duration: Math.random() * 300 + 60, // 1-5 minutes
    metadata: {
      priority: Math.random() > 0.8 ? 'high' : 'normal',
      location: ['village', 'forest', 'mine', 'river'][Math.floor(Math.random() * 4)],
    },
    queuePosition: Math.floor(Math.random() * 15),
    backlogSize: Math.floor(Math.random() * 60) + 10,
  };
});

/**
 * Calculate activity loop metrics from events
 */
function calculateActivityLoopMetrics(events: ActivityLoopEvent[]): ActivityLoopMetrics {
  const startedEvents = events.filter(e => e.type === 'activityStarted');
  const completedEvents = events.filter(e => e.type === 'activityCompleted');
  const failedEvents = events.filter(e => e.type === 'activityFailed');
  const cancelledEvents = events.filter(e => e.type === 'activityCancelled');
  
  const totalStarted = startedEvents.length;
  const totalCompleted = completedEvents.length;
  const totalFailed = failedEvents.length;
  const totalCancelled = cancelledEvents.length;
  
  // Calculate current backlog
  const currentBacklog = Math.max(0, totalStarted - totalCompleted - totalFailed - totalCancelled);
  
  // Calculate average backlog
  const backlogSizes = events.map(e => e.backlogSize || 0).filter(size => size > 0);
  const averageBacklog = backlogSizes.length > 0 
    ? backlogSizes.reduce((sum, size) => sum + size, 0) / backlogSizes.length 
    : 0;
  
  // Calculate max backlog
  const maxBacklog = backlogSizes.length > 0 ? Math.max(...backlogSizes) : 0;
  
  // Calculate throughput rate (activities per hour)
  const timeSpan = events.length > 0 
    ? (Math.max(...events.map(e => e.timestamp)) - Math.min(...events.map(e => e.timestamp))) / (1000 * 60 * 60)
    : 1;
  const throughputRate = totalCompleted / timeSpan;
  
  // Calculate average completion time
  const completionTimes = completedEvents.map(e => e.duration || 0).filter(time => time > 0);
  const averageCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
    : 0;
  
  // Calculate failure rate
  const failureRate = totalStarted > 0 ? (totalFailed / totalStarted) * 100 : 0;
  
  // Calculate cancellation rate
  const cancellationRate = totalStarted > 0 ? (totalCancelled / totalStarted) * 100 : 0;
  
  // Calculate average queue wait time
  const queuePositions = events.map(e => e.queuePosition || 0).filter(pos => pos > 0);
  const averageQueueWait = queuePositions.length > 0
    ? queuePositions.reduce((sum, pos) => sum + pos, 0) / queuePositions.length
    : 0;
  
  return {
    totalStarted,
    totalCompleted,
    totalFailed,
    totalCancelled,
    currentBacklog,
    averageBacklog,
    maxBacklog,
    throughputRate,
    averageCompletionTime,
    failureRate,
    cancellationRate,
    averageQueueWait,
  };
}

/**
 * Determine bottleneck severity
 */
function getBottleneckSeverity(
  currentMetrics: ActivityLoopMetrics,
  targetMetrics: ActivityLoopMetrics,
  thresholds: ActivityLoopMetrics
): 'low' | 'medium' | 'high' | 'critical' {
  const deviations = [
    { current: currentMetrics.throughputRate, target: targetMetrics.throughputRate, weight: 0.3 },
    { current: currentMetrics.currentBacklog, target: targetMetrics.maxBacklog, weight: 0.25 },
    { current: currentMetrics.failureRate, target: targetMetrics.failureRate, weight: 0.2 },
    { current: currentMetrics.cancellationRate, target: targetMetrics.cancellationRate, weight: 0.15 },
    { current: currentMetrics.averageCompletionTime, target: targetMetrics.averageCompletionTime, weight: 0.1 },
  ];
  
  const totalDeviation = deviations.reduce((sum, { current, target, weight }) => {
    const deviation = target > 0 ? Math.abs((current - target) / target) * 100 : 0;
    return sum + (deviation * weight);
  }, 0);
  
  if (totalDeviation >= 75) return 'critical';
  if (totalDeviation >= 50) return 'high';
  if (totalDeviation >= 25) return 'medium';
  return 'low';
}

/**
 * Calculate bottleneck impact score
 */
function calculateImpactScore(
  currentMetrics: ActivityLoopMetrics,
  targetMetrics: ActivityLoopMetrics
): number {
  const factors = [
    Math.max(0, (targetMetrics.throughputRate - currentMetrics.throughputRate) / targetMetrics.throughputRate),
    Math.max(0, (currentMetrics.currentBacklog - targetMetrics.maxBacklog) / targetMetrics.maxBacklog),
    Math.max(0, (currentMetrics.failureRate - targetMetrics.failureRate) / targetMetrics.failureRate),
    Math.max(0, (currentMetrics.cancellationRate - targetMetrics.cancellationRate) / targetMetrics.cancellationRate),
    Math.max(0, (currentMetrics.averageCompletionTime - targetMetrics.averageCompletionTime) / targetMetrics.averageCompletionTime),
  ];
  
  return Math.min(100, factors.reduce((sum, factor) => sum + factor, 0) * 20);
}

/**
 * Generate bottleneck recommendations
 */
function generateRecommendations(
  bottleneck: ActivityBottleneck
): string[] {
  const recommendations: string[] = [];
  const { currentMetrics, targetMetrics, bottleneckType } = bottleneck;
  
  switch (bottleneckType) {
    case 'queue':
      if (currentMetrics.averageQueueWait > targetMetrics.averageQueueWait) {
        recommendations.push('Increase queue processing capacity');
        recommendations.push('Implement priority-based queue management');
        recommendations.push('Add more workers to reduce queue wait time');
      }
      break;
      
    case 'completion':
      if (currentMetrics.throughputRate < targetMetrics.throughputRate) {
        recommendations.push('Optimize activity completion workflow');
        recommendations.push('Reduce activity complexity or duration');
        recommendations.push('Implement parallel processing for compatible activities');
      }
      break;
      
    case 'failure':
      if (currentMetrics.failureRate > targetMetrics.failureRate) {
        recommendations.push('Improve activity success conditions');
        recommendations.push('Add better error handling and retry mechanisms');
        recommendations.push('Review activity requirements and prerequisites');
      }
      break;
      
    case 'resource':
      if (currentMetrics.currentBacklog > targetMetrics.maxBacklog) {
        recommendations.push('Allocate more resources to activity processing');
        recommendations.push('Implement resource pooling and sharing');
        recommendations.push('Optimize resource allocation algorithms');
      }
      break;
  }
  
  // General recommendations
  if (currentMetrics.averageCompletionTime > targetMetrics.averageCompletionTime) {
    recommendations.push('Streamline activity execution process');
    recommendations.push('Remove unnecessary steps or dependencies');
  }
  
  if (currentMetrics.cancellationRate > targetMetrics.cancellationRate) {
    recommendations.push('Improve activity scheduling and timing');
    recommendations.push('Reduce activity conflicts and resource competition');
  }
  
  return recommendations;
}

/**
 * Identify bottlenecks in activity loop
 */
function identifyBottlenecks(
  events: ActivityLoopEvent[],
  config: typeof DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG
): ActivityBottleneck[] {
  const bottlenecks: ActivityBottleneck[] = [];
  const timeWindow = config.config.analysis.timeWindowHours * 60 * 60 * 1000; // Convert to milliseconds
  const now = Date.now();
  const windowStart = now - timeWindow;
  
  // Group events by activity type
  const eventsByActivity = events.reduce((groups, event) => {
    if (!groups[event.activityType]) {
      groups[event.activityType] = [];
    }
    groups[event.activityType].push(event);
    return groups;
  }, {} as Record<string, ActivityLoopEvent[]>);
  
  Object.entries(eventsByActivity).forEach(([activityType, activityEvents]) => {
    // Filter events within time window
    const recentEvents = activityEvents.filter(event => event.timestamp >= windowStart);
    
    if (recentEvents.length < config.config.analysis.minDataPoints) {
      return; // Skip if not enough data
    }
    
    const currentMetrics = calculateActivityLoopMetrics(recentEvents);
    const targetMetrics = config.config.kpiTargets as ActivityLoopMetrics;
    
    // Determine bottleneck type
    let bottleneckType: ActivityBottleneck['bottleneckType'] = 'resource';
    if (currentMetrics.averageQueueWait > targetMetrics.averageQueueWait * 1.5) {
      bottleneckType = 'queue';
    } else if (currentMetrics.throughputRate < targetMetrics.throughputRate * 0.7) {
      bottleneckType = 'completion';
    } else if (currentMetrics.failureRate > targetMetrics.failureRate * 1.5) {
      bottleneckType = 'failure';
    }
    
    const severity = getBottleneckSeverity(currentMetrics, targetMetrics, config.config.alertThresholds as ActivityLoopMetrics);
    const impactScore = calculateImpactScore(currentMetrics, targetMetrics);
    
    // Only include bottlenecks with significant impact
    if (impactScore >= config.config.alertThresholds.low) {
      const bottleneck: ActivityBottleneck = {
        activityId: activityType,
        activityType,
        severity,
        bottleneckType,
        currentMetrics,
        targetMetrics,
        deviationPercentage: impactScore,
        impactScore,
        recommendations: [],
        timeWindow: {
          start: windowStart,
          end: now,
          duration: timeWindow,
        },
      };
      
      bottleneck.recommendations = generateRecommendations(bottleneck);
      bottlenecks.push(bottleneck);
    }
  });
  
  // Sort by impact score (highest first)
  return bottlenecks.sort((a, b) => b.impactScore - a.impactScore);
}

/**
 * Export data to JSON format
 */
function exportToJSON(
  events: ActivityLoopEvent[],
  bottlenecks: ActivityBottleneck[],
  metrics: ActivityLoopMetrics,
  config: typeof DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG
): string {
  return JSON.stringify({
    config,
    events,
    bottlenecks,
    metrics,
    generatedAt: new Date().toISOString(),
    summary: {
      totalEvents: events.length,
      totalBottlenecks: bottlenecks.length,
      criticalBottlenecks: bottlenecks.filter(b => b.severity === 'critical').length,
      highBottlenecks: bottlenecks.filter(b => b.severity === 'high').length,
      mediumBottlenecks: bottlenecks.filter(b => b.severity === 'medium').length,
      lowBottlenecks: bottlenecks.filter(b => b.severity === 'low').length,
    },
  }, null, 2);
}

/**
 * Export data to CSV format
 */
function exportToCSV(bottlenecks: ActivityBottleneck[]): string {
  const headers = ['Activity Type', 'Severity', 'Bottleneck Type', 'Impact Score', 'Current Throughput', 'Target Throughput', 'Current Backlog', 'Max Backlog', 'Failure Rate', 'Recommendations'];
  const rows = bottlenecks.map(b => [
    b.activityType,
    b.severity,
    b.bottleneckType,
    b.impactScore.toFixed(2),
    b.currentMetrics.throughputRate.toFixed(2),
    b.targetMetrics.throughputRate.toFixed(2),
    b.currentMetrics.currentBacklog.toString(),
    b.targetMetrics.maxBacklog.toString(),
    b.currentMetrics.failureRate.toFixed(2),
    `"${b.recommendations.join('; ')}"`,
  ]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Export data to Markdown format
 */
function exportToMarkdown(
  events: ActivityLoopEvent[],
  bottlenecks: ActivityBottleneck[],
  metrics: ActivityLoopMetrics,
  config: typeof DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG
): string {
  let markdown = '# Activity Loop Bottleneck Analysis Report\n\n';
  markdown += `**Generated:** ${new Date().toISOString()}\n`;
  markdown += `**Events Analyzed:** ${events.length}\n`;
  markdown += `**Bottlenecks Identified:** ${bottlenecks.length}\n`;
  markdown += `**Analysis Window:** ${config.config.analysis.timeWindowHours} hours\n\n`;
  
  markdown += '## Current Metrics\n\n';
  markdown += `- **Total Started:** ${metrics.totalStarted.toLocaleString()}\n`;
  markdown += `- **Total Completed:** ${metrics.totalCompleted.toLocaleString()}\n`;
  markdown += `- **Throughput Rate:** ${metrics.throughputRate.toFixed(2)} activities/hour\n`;
  markdown += `- **Current Backlog:** ${metrics.currentBacklog}\n`;
  markdown += `- **Average Backlog:** ${metrics.averageBacklog.toFixed(1)}\n`;
  markdown += `- **Failure Rate:** ${metrics.failureRate.toFixed(2)}%\n`;
  markdown += `- **Cancellation Rate:** ${metrics.cancellationRate.toFixed(2)}%\n`;
  markdown += `- **Average Completion Time:** ${metrics.averageCompletionTime.toFixed(1)}s\n`;
  markdown += `- **Average Queue Wait:** ${metrics.averageQueueWait.toFixed(1)}\n\n`;
  
  markdown += '## Bottleneck Summary\n\n';
  markdown += `- **Critical:** ${bottlenecks.filter(b => b.severity === 'critical').length}\n`;
  markdown += `- **High:** ${bottlenecks.filter(b => b.severity === 'high').length}\n`;
  markdown += `- **Medium:** ${bottlenecks.filter(b => b.severity === 'medium').length}\n`;
  markdown += `- **Low:** ${bottlenecks.filter(b => b.severity === 'low').length}\n\n`;
  
  markdown += '## Identified Bottlenecks\n\n';
  bottlenecks.forEach(bottleneck => {
    markdown += `### ${bottleneck.activityType} (${bottleneck.severity.toUpperCase()})\n\n`;
    markdown += `- **Type:** ${bottleneck.bottleneckType}\n`;
    markdown += `- **Impact Score:** ${bottleneck.impactScore.toFixed(2)}%\n`;
    markdown += `- **Current Throughput:** ${bottleneck.currentMetrics.throughputRate.toFixed(2)} vs Target: ${bottleneck.targetMetrics.throughputRate.toFixed(2)}\n`;
    markdown += `- **Current Backlog:** ${bottleneck.currentMetrics.currentBacklog} vs Max: ${bottleneck.targetMetrics.maxBacklog}\n`;
    markdown += `- **Failure Rate:** ${bottleneck.currentMetrics.failureRate.toFixed(2)}% vs Max: ${bottleneck.targetMetrics.failureRate.toFixed(2)}%\n`;
    markdown += `- **Cancellation Rate:** ${bottleneck.currentMetrics.cancellationRate.toFixed(2)}% vs Max: ${bottleneck.targetMetrics.cancellationRate.toFixed(2)}%\n`;
    markdown += `- **Average Completion Time:** ${bottleneck.currentMetrics.averageCompletionTime.toFixed(1)}s vs Max: ${bottleneck.targetMetrics.averageCompletionTime.toFixed(1)}s\n`;
    markdown += `- **Average Queue Wait:** ${bottleneck.currentMetrics.averageQueueWait.toFixed(1)} vs Max: ${bottleneck.targetMetrics.averageQueueWait.toFixed(1)}\n\n`;
    
    if (bottleneck.recommendations.length > 0) {
      markdown += '**Recommendations:**\n';
      bottleneck.recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }
  });
  
  return markdown;
}

/**
 * Main function to generate reports
 */
async function generateReports(): Promise<void> {
  try {
    console.log('🔍 Generating Activity Loop Bottleneck Analysis Reports...');
    
    // Ensure test-results directory exists
    const testResultsDir = join(process.cwd(), 'test-results');
    if (!existsSync(testResultsDir)) {
      mkdirSync(testResultsDir, { recursive: true });
    }
    
    // Generate timestamp for filenames
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Calculate metrics and bottlenecks
    const metrics = calculateActivityLoopMetrics(SAMPLE_ACTIVITY_LOOP_DATA);
    const bottlenecks = identifyBottlenecks(SAMPLE_ACTIVITY_LOOP_DATA, DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG);
    
    // Generate reports
    const reports = [
      {
        format: 'json' as const,
        filename: `np-049-activity-loop-${timestamp}.json`,
        content: exportToJSON(SAMPLE_ACTIVITY_LOOP_DATA, bottlenecks, metrics, DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG),
      },
      {
        format: 'csv' as const,
        filename: `np-049-activity-loop-${timestamp}.csv`,
        content: exportToCSV(bottlenecks),
      },
      {
        format: 'markdown' as const,
        filename: `np-049-activity-loop-${timestamp}.md`,
        content: exportToMarkdown(SAMPLE_ACTIVITY_LOOP_DATA, bottlenecks, metrics, DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG),
      },
    ];
    
    // Write reports to files
    reports.forEach(report => {
      const filePath = join(testResultsDir, report.filename);
      writeFileSync(filePath, report.content, 'utf8');
      console.log(`✅ Generated ${report.format.toUpperCase()} report: ${report.filename}`);
    });
    
    // Print summary
    console.log('\n📊 Analysis Summary:');
    console.log(`   Total Events: ${SAMPLE_ACTIVITY_LOOP_DATA.length.toLocaleString()}`);
    console.log(`   Bottlenecks Identified: ${bottlenecks.length}`);
    console.log(`   Critical: ${bottlenecks.filter(b => b.severity === 'critical').length}`);
    console.log(`   High: ${bottlenecks.filter(b => b.severity === 'high').length}`);
    console.log(`   Medium: ${bottlenecks.filter(b => b.severity === 'medium').length}`);
    console.log(`   Low: ${bottlenecks.filter(b => b.severity === 'low').length}`);
    console.log(`   Throughput Rate: ${metrics.throughputRate.toFixed(2)} activities/hour`);
    console.log(`   Current Backlog: ${metrics.currentBacklog}`);
    console.log(`   Failure Rate: ${metrics.failureRate.toFixed(2)}%`);
    
    console.log('\n🎯 Identified Bottlenecks:');
    bottlenecks.forEach(bottleneck => {
      console.log(`   • ${bottleneck.activityType} (${bottleneck.severity.toUpperCase()}) - ${bottleneck.bottleneckType} - Impact: ${bottleneck.impactScore.toFixed(1)}%`);
    });
    
    console.log('\n✨ Reports saved to test-results/ directory');
    
  } catch (error) {
    console.error('❌ Error generating reports:', error);
    process.exit(1);
  }
}

// Run the report generation
if (require.main === module) {
  generateReports();
}
