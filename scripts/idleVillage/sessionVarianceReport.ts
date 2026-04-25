#!/usr/bin/env tsx

/**
 * Idle Village Session Variance Report CLI
 * 
 * Command-line tool for generating cross-platform session variance reports
 * from mobile playtest logs and desktop session data.
 * 
 * @since NP-053 – Idle Village Session Variance Monitor
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import type {
  SessionVarianceConfig,
  SessionData,
  SessionStatistics,
  Platform,
  SessionBucket,
} from '../../src/ui/idleVillage/config/sessionVarianceConfig';
import {
  DEFAULT_SESSION_VARIANCE_CONFIG,
  createSafeSessionVarianceConfig,
  getSessionBucket,
  validateSessionData,
  createSafeSessionData,
  calculateSessionStatistics,
  formatDuration,
  calculatePercentageDifference,
  isVarianceExcessive,
  isSessionOutlier,
  isBucketDistributionBalanced,
  isPlatformDistributionBalanced,
} from '../../src/ui/idleVillage/config/sessionVarianceConfig';

/**
 * CLI options
 */
interface CliOptions {
  input: string;
  output?: string;
  format: 'json' | 'csv' | 'markdown' | 'table';
  config?: string;
  platform?: 'desktop' | 'mobile' | 'all';
  bucket?: 'short' | 'medium' | 'long' | 'all';
  verbose: boolean;
  alerts: boolean;
  trend: boolean;
  compare: boolean;
}

/**
 * Mobile playtest log parser
 */
class MobilePlaytestParser {
  /**
   * Parse mobile playtest log file
   */
  static parseMobileLog(filePath: string): SessionData[] {
    if (!existsSync(filePath)) {
      throw new Error(`Mobile log file not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const sessions: SessionData[] = [];

    for (const line of lines) {
      try {
        // Expected format: JSON object per line
        const entry = JSON.parse(line);
        
        // Extract session data from mobile log format
        if (entry.type === 'session_end' && entry.data) {
          const session = createSafeSessionData({
            id: entry.data.sessionId || `mobile-${Date.now()}-${Math.random()}`,
            platform: 'mobile',
            startTime: entry.data.startTime || entry.data.timestamp - (entry.data.duration * 1000),
            endTime: entry.data.endTime || entry.data.timestamp,
            duration: entry.data.duration || 0,
            bucket: getSessionBucket(entry.data.duration || 0),
            userId: entry.data.userId,
            metadata: {
              device: entry.data.device,
              os: entry.data.os,
              appVersion: entry.data.appVersion,
              ...entry.data.metadata,
            },
          });

          sessions.push(session);
        }
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Failed to parse line: ${line.substring(0, 50)}...`));
      }
    }

    return sessions;
  }
}

/**
 * Desktop session data parser
 */
class DesktopSessionParser {
  /**
   * Parse desktop session data
   */
  static parseDesktopData(filePath: string): SessionData[] {
    if (!existsSync(filePath)) {
      throw new Error(`Desktop session file not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data)) {
      throw new Error('Desktop session data must be an array');
    }

    return data
      .filter(validateSessionData)
      .map(session => createSafeSessionData({
        ...session,
        platform: 'desktop',
      }));
  }
}

/**
 * Report generator
 */
class ReportGenerator {
  private config: SessionVarianceConfig;
  private sessions: SessionData[];
  private statistics: SessionStatistics;

  constructor(config: SessionVarianceConfig, sessions: SessionData[]) {
    this.config = config;
    this.sessions = sessions;
    this.statistics = calculateSessionStatistics(sessions);
  }

  /**
   * Generate table report
   */
  generateTableReport(verbose: boolean = false): string {
    const output: string[] = [];

    // Header
    output.push(chalk.bold.blue('📊 Idle Village Session Variance Report'));
    output.push(chalk.gray(`Generated: ${new Date().toLocaleString()}`));
    output.push('');

    // Overview table
    const overviewTable = new Table({
      head: [chalk.cyan('Metric'), chalk.cyan('Value'), chalk.cyan('Target'), chalk.cyan('Status')],
      colWidths: [20, 15, 15, 10],
    });

    const varianceStatus = isVarianceExcessive(
      this.statistics.variance,
      this.config.kpiTargets.maxVariance,
      this.config.alerts.thresholds.varianceThreshold
    ) ? chalk.red('❌ High') : chalk.green('✅ OK');

    overviewTable.push(
      ['Total Sessions', this.statistics.totalSessions.toString(), 'N/A', chalk.blue('Info')],
      ['Avg Duration', formatDuration(this.statistics.averageDuration), 'N/A', chalk.blue('Info')],
      ['Median Duration', formatDuration(this.statistics.medianDuration), 'N/A', chalk.blue('Info')],
      ['Std Deviation', formatDuration(this.statistics.standardDeviation), formatDuration(this.config.kpiTargets.targetStdDev), varianceStatus],
      ['Variance', this.statistics.variance.toFixed(0), this.config.kpiTargets.maxVariance.toString(), varianceStatus],
      ['Min Duration', formatDuration(this.statistics.minDuration), 'N/A', chalk.blue('Info')],
      ['Max Duration', formatDuration(this.statistics.maxDuration), 'N/A', chalk.blue('Info')],
    );

    output.push(overviewTable.toString());
    output.push('');

    // Platform distribution
    const platformTable = new Table({
      head: [chalk.cyan('Platform'), chalk.cyan('Sessions'), chalk.cyan('Percentage'), chalk.cyan('Target'), chalk.cyan('Status')],
      colWidths: [12, 10, 12, 12, 10],
    });

    Object.entries(this.statistics.platformDistribution).forEach(([platform, count]) => {
      const percentage = ((count / this.statistics.totalSessions) * 100).toFixed(1);
      const target = (this.config.kpiTargets.targetPlatformDistribution[platform as Platform] * 100).toFixed(1);
      const status = isPlatformDistributionBalanced(
        this.statistics.platformDistribution,
        this.config.kpiTargets.targetPlatformDistribution,
        this.config.alerts.thresholds.platformDivergenceThreshold
      ) ? chalk.green('✅') : chalk.yellow('⚠️');

      platformTable.push([platform, count.toString(), `${percentage}%`, `${target}%`, status]);
    });

    output.push(chalk.bold('📱 Platform Distribution'));
    output.push(platformTable.toString());
    output.push('');

    // Bucket distribution
    const bucketTable = new Table({
      head: [chalk.cyan('Bucket'), chalk.cyan('Sessions'), chalk.cyan('Percentage'), chalk.cyan('Target'), chalk.cyan('Status')],
      colWidths: [15, 10, 12, 12, 10],
    });

    Object.entries(this.statistics.bucketDistribution).forEach(([bucket, count]) => {
      const percentage = ((count / this.statistics.totalSessions) * 100).toFixed(1);
      const target = (this.config.kpiTargets.targetBucketDistribution[bucket as SessionBucket] * 100).toFixed(1);
      const status = isBucketDistributionBalanced(
        this.statistics.bucketDistribution,
        this.config.kpiTargets.targetBucketDistribution,
        this.config.alerts.thresholds.bucketImbalanceThreshold
      ) ? chalk.green('✅') : chalk.yellow('⚠️');

      const bucketConfig = this.config.buckets[bucket as SessionBucket];
      bucketTable.push([bucketConfig.name, count.toString(), `${percentage}%`, `${target}%`, status]);
    });

    output.push(chalk.bold('🪣 Bucket Distribution'));
    output.push(bucketTable.toString());
    output.push('');

    // Alerts
    const alerts = this.generateAlerts();
    if (alerts.length > 0) {
      output.push(chalk.bold.red('⚠️ Alerts'));
      const alertTable = new Table({
        head: [chalk.cyan('Type'), chalk.cyan('Severity'), chalk.cyan('Message')],
        colWidths: [20, 10, 50],
      });

      alerts.forEach(alert => {
        const severity = alert.severity === 'critical' ? chalk.red(alert.severity) :
                          alert.severity === 'high' ? chalk.red(alert.severity) :
                          alert.severity === 'medium' ? chalk.yellow(alert.severity) :
                          chalk.green(alert.severity);
        
        alertTable.push([alert.type, severity, alert.message]);
      });

      output.push(alertTable.toString());
      output.push('');
    } else {
      output.push(chalk.green('✅ No alerts - All KPIs within target ranges'));
      output.push('');
    }

    // Verbose details
    if (verbose) {
      output.push(chalk.bold('📋 Detailed Statistics'));
      output.push(`Standard Deviation: ${this.statistics.standardDeviation.toFixed(2)}s`);
      output.push(`Variance: ${this.statistics.variance.toFixed(2)}`);
      output.push(`Coefficient of Variation: ${((this.statistics.standardDeviation / this.statistics.averageDuration) * 100).toFixed(2)}%`);
      output.push('');

      // Recent sessions
      output.push(chalk.bold('🕐 Recent Sessions (Last 10)'));
      const recentTable = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('Platform'), chalk.cyan('Duration'), chalk.cyan('Bucket'), chalk.cyan('Start Time')],
        colWidths: [25, 10, 12, 10, 20],
      });

      this.sessions.slice(-10).forEach(session => {
        recentTable.push([
          session.id.substring(0, 23),
          session.platform,
          formatDuration(session.duration),
          session.bucket,
          new Date(session.startTime).toLocaleString()
        ]);
      });

      output.push(recentTable.toString());
    }

    return output.join('\n');
  }

  /**
   * Generate JSON report
   */
  generateJsonReport(): string {
    return JSON.stringify({
      config: this.config,
      sessions: this.sessions,
      statistics: this.statistics,
      alerts: this.generateAlerts(),
      generatedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Generate CSV report
   */
  generateCsvReport(): string {
    const headers = [
      'ID',
      'Platform',
      'Start Time',
      'End Time',
      'Duration (s)',
      'Bucket',
      'User ID',
    ];
    
    const rows = this.sessions.map(session => [
      session.id,
      session.platform,
      new Date(session.startTime).toISOString(),
      new Date(session.endTime).toISOString(),
      session.duration.toString(),
      session.bucket,
      session.userId || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      'Statistics',
      `Total Sessions,${this.statistics.totalSessions}`,
      `Average Duration,${this.statistics.averageDuration}`,
      `Median Duration,${this.statistics.medianDuration}`,
      `Standard Deviation,${this.statistics.standardDeviation}`,
      `Variance,${this.statistics.variance}`,
      `Min Duration,${this.statistics.minDuration}`,
      `Max Duration,${this.statistics.maxDuration}`,
    ].join('\n');

    return csvContent;
  }

  /**
   * Generate Markdown report
   */
  generateMarkdownReport(): string {
    const alerts = this.generateAlerts();
    
    return `# Idle Village Session Variance Report

**Generated:** ${new Date().toLocaleString()}
**Total Sessions:** ${this.statistics.totalSessions}

## Configuration

### Buckets
${Object.entries(this.config.buckets).map(([key, bucket]) => 
  `- **${bucket.name}** (${key}): ${formatDuration(bucket.minDuration)} - ${bucket.maxDuration === Infinity ? '∞' : formatDuration(bucket.maxDuration)}`
).join('\n')}

### KPI Targets
- **Target Std Dev:** ${formatDuration(this.config.kpiTargets.targetStdDev)}
- **Max Variance:** ${this.config.kpiTargets.maxVariance}
- **Platform Divergence:** ${(this.config.kpiTargets.maxPlatformDivergence * 100).toFixed(1)}%

## Statistics

### Overall
| Metric | Value |
|---|---|
| Total Sessions | ${this.statistics.totalSessions} |
| Average Duration | ${formatDuration(this.statistics.averageDuration)} |
| Median Duration | ${formatDuration(this.statistics.medianDuration)} |
| Standard Deviation | ${formatDuration(this.statistics.standardDeviation)} |
| Variance | ${this.statistics.variance.toFixed(0)} |
| Min Duration | ${formatDuration(this.statistics.minDuration)} |
| Max Duration | ${formatDuration(this.statistics.maxDuration)} |

### Platform Distribution
| Platform | Sessions | Percentage | Target | Status |
|---|---|---|---|---|
${Object.entries(this.statistics.platformDistribution).map(([platform, count]) => {
  const percentage = ((count / this.statistics.totalSessions) * 100).toFixed(1);
  const target = (this.config.kpiTargets.targetPlatformDistribution[platform as Platform] * 100).toFixed(1);
  const status = isPlatformDistributionBalanced(
    this.statistics.platformDistribution,
    this.config.kpiTargets.targetPlatformDistribution,
    this.config.alerts.thresholds.platformDivergenceThreshold
  ) ? '✅ OK' : '⚠️ Warning';
  return `| ${platform} | ${count} | ${percentage}% | ${target}% | ${status} |`;
}).join('\n')}

### Bucket Distribution
| Bucket | Sessions | Percentage | Target | Status |
|---|---|---|---|---|
${Object.entries(this.statistics.bucketDistribution).map(([bucket, count]) => {
  const percentage = ((count / this.statistics.totalSessions) * 100).toFixed(1);
  const target = (this.config.kpiTargets.targetBucketDistribution[bucket as SessionBucket] * 100).toFixed(1);
  const status = isBucketDistributionBalanced(
    this.statistics.bucketDistribution,
    this.config.kpiTargets.targetBucketDistribution,
    this.config.alerts.thresholds.bucketImbalanceThreshold
  ) ? '✅ OK' : '⚠️ Warning';
  const bucketConfig = this.config.buckets[bucket as SessionBucket];
  return `| ${bucketConfig.name} | ${count} | ${percentage}% | ${target}% | ${status} |`;
}).join('\n')}

## Alerts

${alerts.length === 0 ? '✅ No active alerts. All KPIs are within target ranges.' : alerts.map(alert => 
  `- **${alert.type}** (${alert.severity}): ${alert.message}`
).join('\n')}

## Recent Sessions

| ID | Platform | Duration | Bucket | Start Time |
|---|---|---|---|---|
${this.sessions.slice(-10).map(session => 
  `| ${session.id} | ${session.platform} | ${formatDuration(session.duration)} | ${session.bucket} | ${new Date(session.startTime).toLocaleString()} |`
).join('\n')}
`;
  }

  /**
   * Generate alerts
   */
  private generateAlerts() {
    const alerts = [];
    const now = Date.now();

    // Check variance threshold
    if (isVarianceExcessive(
      this.statistics.variance,
      this.config.kpiTargets.maxVariance,
      this.config.alerts.thresholds.varianceThreshold
    )) {
      alerts.push({
        id: `variance-${now}`,
        type: 'high_variance' as const,
        severity: 'high' as const,
        message: `Session variance (${formatDuration(this.statistics.standardDeviation)}) exceeds target by ${calculatePercentageDifference(
          this.statistics.variance,
          this.config.kpiTargets.maxVariance
        ).toFixed(1)}%`,
        timestamp: now,
        data: {
          variance: this.statistics.variance,
          threshold: this.config.kpiTargets.maxVariance,
          actualValue: this.statistics.standardDeviation,
          expectedValue: Math.sqrt(this.config.kpiTargets.maxVariance),
        },
      });
    }

    // Check for outliers
    const outliers = this.sessions.filter(session =>
      isSessionOutlier(
        session.duration,
        this.statistics.averageDuration,
        this.statistics.standardDeviation,
        this.config.alerts.thresholds.outlierThreshold
      )
    );

    if (outliers.length > 0) {
      alerts.push({
        id: `outliers-${now}`,
        type: 'outlier' as const,
        severity: 'medium' as const,
        message: `Found ${outliers.length} outlier sessions (±${this.config.alerts.thresholds.outlierThreshold}σ)`,
        timestamp: now,
        data: {
          actualValue: outliers.length,
          threshold: this.config.alerts.thresholds.outlierThreshold,
        },
      });
    }

    return alerts;
  }
}

/**
 * Main CLI function
 */
async function main() {
  program
    .name('session-variance-report')
    .description('Generate Idle Village session variance reports')
    .version('1.0.0');

  program
    .requiredOption('-i, --input <path>', 'Input file path (mobile log or desktop data)')
    .option('-o, --output <path>', 'Output file path (default: stdout)')
    .option('-f, --format <format>', 'Output format', 'table')
    .option('-c, --config <path>', 'Custom configuration file')
    .option('-p, --platform <platform>', 'Filter by platform')
    .option('-b, --bucket <bucket>', 'Filter by bucket')
    .option('-v, --verbose', 'Verbose output')
    .option('--alerts', 'Show alerts only')
    .option('--trend', 'Show trend analysis')
    .option('--compare', 'Compare with previous run');

  program.parse();

  const options = program.opts() as CliOptions;

  try {
    // Load configuration
    let config = DEFAULT_SESSION_VARIANCE_CONFIG;
    if (options.config && existsSync(options.config)) {
      const configData = JSON.parse(readFileSync(options.config, 'utf-8'));
      config = createSafeSessionVarianceConfig(configData);
    }

    // Parse input data
    let sessions: SessionData[] = [];
    
    // Try to detect file type and parse accordingly
    if (options.input.endsWith('.log') || options.input.includes('mobile')) {
      sessions = MobilePlaytestParser.parseMobileLog(options.input);
    } else {
      sessions = DesktopSessionParser.parseDesktopData(options.input);
    }

    // Filter sessions
    if (options.platform && options.platform !== 'all') {
      sessions = sessions.filter(s => s.platform === options.platform);
    }

    if (options.bucket && options.bucket !== 'all') {
      sessions = sessions.filter(s => s.bucket === options.bucket);
    }

    if (sessions.length === 0) {
      console.log(chalk.yellow('No sessions found matching the criteria.'));
      process.exit(0);
    }

    // Generate report
    const generator = new ReportGenerator(config, sessions);
    let output: string;

    switch (options.format) {
      case 'json':
        output = generator.generateJsonReport();
        break;
      case 'csv':
        output = generator.generateCsvReport();
        break;
      case 'markdown':
        output = generator.generateMarkdownReport();
        break;
      case 'table':
      default:
        output = generator.generateTableReport(options.verbose);
        break;
    }

    // Write output
    if (options.output) {
      writeFileSync(options.output, output);
      console.log(chalk.green(`Report saved to: ${options.output}`));
    } else {
      console.log(output);
    }

  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main().catch(console.error);
}

export { ReportGenerator, MobilePlaytestParser, DesktopSessionParser };
