#!/usr/bin/env tsx

/**
 * Active HUD Performance Profile CLI Tool
 * 
 * Command-line interface for exporting and analyzing Active HUD performance data.
 * Supports JSON, CSV, and Markdown export formats with filtering and aggregation.
 * 
 * @since NP-104 – Idle Village Active HUD Performance Profiler
 * @dependencies Phase 12 Active HUD
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PersistenceService } from '../../persistence/PersistenceService';
import type { 
  ActiveHUDProfilerConfig,
  PerformanceMetricType 
} from '../../ui/idleVillage/config/activeHUDProfilerConfig';

/**
 * CLI options interface
 */
interface CLIOptions {
  input?: string;
  output?: string;
  format: 'json' | 'csv' | 'markdown';
  metric?: PerformanceMetricType;
  session?: string;
  threshold?: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  verbose: boolean;
}

/**
 * Performance session data structure
 */
interface PerformanceSession {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number;
  dataPoints: number;
  metadata: {
    userAgent: string;
    viewport: { width: number; height: number };
    deviceMemory: number;
    hardwareConcurrency: number;
  };
}

/**
 * Performance data point
 */
interface PerformanceDataPoint {
  timestamp: number;
  value: number;
  threshold: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  metadata?: Record<string, any>;
}

/**
 * Aggregated performance statistics
 */
interface PerformanceStats {
  average: number;
  min: number;
  max: number;
  median: number;
  p95: number;
  stdDev: number;
  sampleCount: number;
  currentThreshold: string;
}

/**
 * Complete performance export data
 */
interface PerformanceExportData {
  session: PerformanceSession;
  config?: any;
  metrics: Array<{
    metric: PerformanceMetricType;
    data?: PerformanceDataPoint[];
    stats?: PerformanceStats;
  }>;
  timestamp: number;
}

/**
 * Main CLI program
 */
const program = new Command();

program
  .name('active-hud-profile')
  .description('CLI tool for Active HUD performance data export and analysis')
  .version('1.0.0');

program
  .command('export')
  .description('Export performance data from stored sessions')
  .option('-i, --input <path>', 'Input file path (default: read from PersistenceService)')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Export format (json, csv, markdown)', 'json')
  .option('-m, --metric <metric>', 'Filter by specific metric')
  .option('-s, --session <session>', 'Filter by session ID')
  .option('-t, --threshold <threshold>', 'Filter by performance threshold')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (options: CLIOptions) => {
    try {
      const data = await loadPerformanceData(options);
      const filteredData = filterData(data, options);
      const output = await exportData(filteredData, options);
      
      if (options.output) {
        writeFileSync(options.output, output);
        console.log(`✅ Exported to: ${options.output}`);
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error('❌ Export failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available performance sessions')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (options: { verbose: boolean }) => {
    try {
      const sessions = await listSessions();
      
      if (sessions.length === 0) {
        console.log('📊 No performance sessions found');
        return;
      }

      console.log(`📊 Found ${sessions.length} performance sessions:\n`);
      
      sessions.forEach(session => {
        const duration = session.endTime ? session.duration : Date.now() - session.startTime;
        const durationFormatted = formatDuration(duration);
        const status = session.endTime ? '✅ Completed' : '🔄 Active';
        
        console.log(`${status} ${session.id.substr(0, 8)} (${durationFormatted}) - ${session.dataPoints} data points`);
        
        if (options.verbose) {
          console.log(`  Started: ${new Date(session.startTime).toISOString()}`);
          console.log(`  Viewport: ${session.metadata.viewport.width}x${session.metadata.viewport.height}`);
          console.log(`  Device Memory: ${session.metadata.deviceMemory}GB`);
          console.log(`  CPU Cores: ${session.metadata.hardwareConcurrency}`);
        }
      });
    } catch (error) {
      console.error('❌ Failed to list sessions:', error.message);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze performance data and generate insights')
  .option('-i, --input <path>', 'Input file path')
  .option('-s, --session <session>', 'Analyze specific session')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (options: { input?: string; session?: string; verbose: boolean }) => {
    try {
      const data = await loadPerformanceData({ input: options.input, format: 'json', verbose: options.verbose });
      const analysis = analyzePerformance(data, options);
      
      console.log('📈 Performance Analysis:\n');
      console.log(analysis);
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('cleanup')
  .description('Clean up old performance data')
  .option('-d, --days <days>', 'Remove sessions older than N days', '30')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (options: { days: string; verbose: boolean }) => {
    try {
      const days = parseInt(options.days);
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      const removed = await cleanupOldSessions(cutoff, options.verbose);
      
      console.log(`🧹 Cleaned up ${removed} sessions older than ${days} days`);
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    }
  });

/**
 * Load performance data from file or persistence
 */
async function loadPerformanceData(options: CLIOptions): Promise<PerformanceExportData> {
  if (options.input && existsSync(options.input)) {
    const rawData = readFileSync(options.input, 'utf-8');
    return JSON.parse(rawData) as PerformanceExportData;
  }

  // Load from PersistenceService
  const keys = await PersistenceService.getAllKeys();
  const sessionKeys = keys.filter(key => key.startsWith('active_hud_session_'));
  
  if (sessionKeys.length === 0) {
    throw new Error('No performance sessions found');
  }

  // Get the most recent session if no specific session requested
  const targetKey = options.session 
    ? sessionKeys.find(key => key.includes(options.session!))
    : sessionKeys.sort().pop();

  if (!targetKey) {
    throw new Error(`Session ${options.session || 'latest'} not found`);
  }

  const sessionData = await PersistenceService.loadData(targetKey);
  if (!sessionData) {
    throw new Error('Failed to load session data');
  }

  return sessionData as PerformanceExportData;
}

/**
 * Filter performance data based on CLI options
 */
function filterData(data: PerformanceExportData, options: CLIOptions): PerformanceExportData {
  let filteredMetrics = data.metrics;

  // Filter by metric type
  if (options.metric) {
    filteredMetrics = filteredMetrics.filter(m => m.metric === options.metric);
  }

  // Filter by threshold
  if (options.threshold) {
    filteredMetrics = filteredMetrics.map(metric => ({
      ...metric,
      data: metric.data?.filter(point => point.threshold === options.threshold),
      stats: metric.stats?.currentThreshold === options.threshold ? metric.stats : null
    }));
  }

  return {
    ...data,
    metrics: filteredMetrics
  };
}

/**
 * Export data in specified format
 */
async function exportData(data: PerformanceExportData, options: CLIOptions): Promise<string> {
  switch (options.format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    
    case 'csv':
      return convertToCSV(data);
    
    case 'markdown':
      return convertToMarkdown(data);
    
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Convert performance data to CSV format
 */
function convertToCSV(data: PerformanceExportData): string {
  const headers = ['timestamp', 'metric', 'value', 'threshold'];
  const rows = [headers.join(',')];

  data.metrics.forEach(metric => {
    if (metric.data) {
      metric.data.forEach(point => {
        rows.push([
          point.timestamp,
          metric.metric,
          point.value,
          point.threshold
        ].join(','));
      });
    }
  });

  return rows.join('\n');
}

/**
 * Convert performance data to Markdown format
 */
function convertToMarkdown(data: PerformanceExportData): string {
  let markdown = '# Active HUD Performance Report\n\n';
  
  // Session information
  markdown += '## Session Information\n\n';
  markdown += `- **Session ID**: ${data.session.id}\n`;
  markdown += `- **Duration**: ${formatDuration(data.session.duration)}\n`;
  markdown += `- **Data Points**: ${data.session.dataPoints}\n`;
  markdown += `- **Start Time**: ${new Date(data.session.startTime).toISOString()}\n`;
  markdown += `- **End Time**: ${data.session.endTime ? new Date(data.session.endTime).toISOString() : 'Ongoing'}\n`;
  markdown += `- **Device**: ${data.session.metadata.userAgent}\n`;
  markdown += `- **Viewport**: ${data.session.metadata.viewport.width}x${data.session.metadata.viewport.height}\n\n`;

  // Performance metrics
  markdown += '## Performance Metrics\n\n';
  
  data.metrics.forEach(metric => {
    markdown += `### ${metric.metric}\n\n`;
    
    if (metric.stats) {
      const stats = metric.stats;
      markdown += '| Statistic | Value |\n';
      markdown += '|-----------|-------|\n';
      markdown += `| Average | ${stats.average.toFixed(2)} |\n`;
      markdown += `| Minimum | ${stats.min.toFixed(2)} |\n`;
      markdown += `| Maximum | ${stats.max.toFixed(2)} |\n`;
      markdown += `| Median | ${stats.median.toFixed(2)} |\n`;
      markdown += `| 95th Percentile | ${stats.p95.toFixed(2)} |\n`;
      markdown += `| Standard Deviation | ${stats.stdDev.toFixed(2)} |\n`;
      markdown += `| Current Threshold | ${stats.currentThreshold} |\n\n`;
    }
    
    if (metric.data && metric.data.length > 0) {
      markdown += '#### Recent Data Points\n\n';
      markdown += '| Timestamp | Value | Threshold |\n';
      markdown += '|-----------|-------|-----------|\n';
      
      metric.data.slice(-10).forEach(point => {
        markdown += `| ${new Date(point.timestamp).toISOString()} | ${point.value.toFixed(2)} | ${point.threshold} |\n`;
      });
      
      markdown += '\n';
    }
  });

  return markdown;
}

/**
 * List available performance sessions
 */
async function listSessions(): Promise<PerformanceSession[]> {
  const keys = await PersistenceService.getAllKeys();
  const sessionKeys = keys.filter(key => key.startsWith('active_hud_session_'));
  
  const sessions: PerformanceSession[] = [];
  
  for (const key of sessionKeys) {
    try {
      const data = await PersistenceService.loadData(key);
      if (data && data.session) {
        sessions.push(data.session);
      }
    } catch (error) {
      console.warn(`Failed to load session ${key}:`, error.message);
    }
  }

  return sessions.sort((a, b) => b.startTime - a.startTime);
}

/**
 * Analyze performance data and generate insights
 */
function analyzePerformance(data: PerformanceExportData, options: { verbose?: boolean }): string {
  let analysis = '';
  
  // Overall session summary
  analysis += '## Session Summary\n\n';
  analysis += `- **Total Duration**: ${formatDuration(data.session.duration)}\n`;
  analysis += `- **Total Data Points**: ${data.session.dataPoints}\n`;
  analysis += `- **Metrics Tracked**: ${data.metrics.length}\n\n`;

  // Performance insights
  analysis += '## Performance Insights\n\n';
  
  data.metrics.forEach(metric => {
    if (!metric.stats) return;
    
    const stats = metric.stats;
    const threshold = stats.currentThreshold;
    
    analysis += `### ${metric.metric}\n`;
    analysis += `- **Current Performance**: ${threshold} (${stats.average.toFixed(2)})\n`;
    
    if (threshold === 'critical' || threshold === 'poor') {
      analysis += `- ⚠️ **Performance Issue Detected**\n`;
      analysis += `- **Recommendation**: Consider optimization for ${metric.metric}\n`;
    } else if (threshold === 'excellent') {
      analysis += `- ✅ **Excellent Performance**\n`;
    }
    
    // Variance analysis
    const variance = stats.stdDev / stats.average;
    if (variance > 0.5) {
      analysis += `- 📊 **High Variance Detected** (${(variance * 100).toFixed(1)}%)\n`;
      analysis += `- **Recommendation**: Performance is inconsistent, investigate spikes\n`;
    }
    
    analysis += '\n';
  });

  // Device-specific insights
  analysis += '## Device Analysis\n\n';
  analysis += `- **Device Memory**: ${data.session.metadata.deviceMemory}GB\n`;
  analysis += `- **CPU Cores**: ${data.session.metadata.hardwareConcurrency}\n`;
  analysis += `- **Viewport**: ${data.session.metadata.viewport.width}x${data.session.metadata.viewport.height}\n\n`;

  // Recommendations
  analysis += '## Recommendations\n\n';
  
  const criticalMetrics = data.metrics.filter(m => m.stats?.currentThreshold === 'critical');
  if (criticalMetrics.length > 0) {
    analysis += `- **Priority**: Address critical performance issues in ${criticalMetrics.map(m => m.metric).join(', ')}\n`;
  }
  
  const poorMetrics = data.metrics.filter(m => m.stats?.currentThreshold === 'poor');
  if (poorMetrics.length > 0) {
    analysis += `- **Secondary**: Improve performance for ${poorMetrics.map(m => m.metric).join(', ')}\n`;
  }
  
  if (criticalMetrics.length === 0 && poorMetrics.length === 0) {
    analysis += `- ✅ **Good Performance**: All metrics are performing acceptably or better\n`;
  }

  return analysis;
}

/**
 * Clean up old performance sessions
 */
async function cleanupOldSessions(cutoff: number, verbose: boolean): Promise<number> {
  const sessions = await listSessions();
  const oldSessions = sessions.filter(session => session.startTime < cutoff);
  
  let removed = 0;
  
  for (const session of oldSessions) {
    try {
      const key = `active_hud_session_${session.id}`;
      await PersistenceService.deleteData(key);
      removed++;
      
      if (verbose) {
        console.log(`Removed session: ${session.id.substr(0, 8)}`);
      }
    } catch (error) {
      console.warn(`Failed to remove session ${session.id}:`, error.message);
    }
  }
  
  return removed;
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Main execution
 */
async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('❌ CLI error:', error.message);
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main();
}

export { main };
