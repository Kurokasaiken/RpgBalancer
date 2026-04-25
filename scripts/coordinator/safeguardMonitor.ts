#!/usr/bin/env tsx

/**
 * Global Safeguard Monitor Dashboard Script
 *
 * Aggregates evidence logs from NP-099 Evidence Log Harvester and produces
 * JSON/CSV status for the Safeguard Monitor Dashboard.
 *
 * @module safeguardMonitor
 * @since 2026-01-13
 * @author Cascade
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Command } from 'commander';

// Types for Evidence Log Harvester (inline to avoid circular dependency)
interface EvidenceLogEntry {
  path: string;
  name: string;
  extension: string;
  size: number;
  modifiedAt: number;
  taskId?: string;
  date?: string;
  type: 'evidence' | 'report' | 'data' | 'unknown';
  preview: string;
  metadata: Record<string, unknown>;
}

interface HarvestResults {
  totalScanned: number;
  processed: number;
  filtered: number;
  errors: string[];
  entries: EvidenceLogEntry[];
  summary: {
    byType: Record<string, number>;
    byExtension: Record<string, number>;
    byTask: Record<string, number>;
    dateRange: {
      earliest: number | null;
      latest: number | null;
    };
  };
}

/**
 * Safeguard check result for a single prompt
 */
export interface SafeguardCheckResult {
  /** Prompt identifier (NP-099, KS-081, etc.) */
  promptId: string;
  /** Prompt title/description */
  title: string;
  /** Overall safeguard status */
  status: 'pass' | 'fail' | 'warning' | 'unknown';
  /** Individual check results */
  checks: {
    lint: CheckStatus;
    test: CheckStatus;
    build: CheckStatus;
    kanban: CheckStatus;
  };
  /** Timestamp of latest evidence */
  lastEvidence: number;
  /** Path to latest evidence log */
  evidencePath: string;
  /** Severity score (0-100, higher = worse) */
  severity: number;
  /** Issues found */
  issues: string[];
  /** Metadata from evidence logs */
  metadata: Record<string, unknown>;
}

/**
 * Individual check status
 */
export interface CheckStatus {
  /** Check result */
  status: 'pass' | 'fail' | 'warning' | 'skip' | 'unknown';
  /** Execution time in milliseconds */
  duration?: number;
  /** Error message if failed */
  error?: string;
  /** Number of issues found */
  issues?: number;
  /** Check timestamp */
  timestamp: number;
}

/**
 * Aggregated safeguard report
 */
export interface SafeguardReport {
  /** Report generation timestamp */
  generatedAt: number;
  /** Report version */
  version: string;
  /** Summary statistics */
  summary: {
    totalPrompts: number;
    passed: number;
    failed: number;
    warnings: number;
    unknown: number;
    averageSeverity: number;
    worstSeverity: number;
  };
  /** Individual prompt results */
  results: SafeguardCheckResult[];
  /** Global issues */
  globalIssues: string[];
  /** Report period */
  period: {
    start: number;
    end: number;
  };
}

/**
 * Configuration for safeguard monitoring
 */
export interface SafeguardMonitorConfig {
  /** Base directories to scan for evidence */
  evidenceDirs: string[];
  /** Prompt IDs to include (empty = all) */
  promptIds?: string[];
  /** Date range filter */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Severity thresholds */
  severityThresholds: {
    warning: number;
    critical: number;
  };
  /** Output format */
  outputFormat: 'json' | 'csv' | 'both';
  /** Output file path */
  outputPath?: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SafeguardMonitorConfig = {
  evidenceDirs: ['./test-results', './src/test-results', './logs'],
  severityThresholds: {
    warning: 30,
    critical: 70,
  },
  outputFormat: 'both',
  outputPath: './test-results/safeguard-monitor-report',
};

/**
 * Safeguard Monitor class
 */
export class SafeguardMonitor {
  private config: SafeguardMonitorConfig;

  constructor(config: Partial<SafeguardMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run safeguard monitoring and generate report
   */
  async run(): Promise<SafeguardReport> {
    console.log('🔍 Starting Safeguard Monitor...');
    
    // Harvest evidence logs
    const harvestResults = await this.harvestEvidence();
    console.log(`📊 Found ${harvestResults.processed} evidence logs`);
    
    // Process evidence and generate results
    const results = this.processEvidence(harvestResults);
    console.log(`📋 Processed ${results.length} prompts`);
    
    // Generate report
    const report = this.generateReport(results);
    console.log(`📄 Generated report with ${report.summary.failed} failures`);
    
    // Save report
    await this.saveReport(report);
    
    return report;
  }

  /**
   * Harvest evidence logs using Evidence Log Harvester
   */
  private async harvestEvidence(): Promise<HarvestResults> {
    // Dynamic import to avoid circular dependency
    const { EvidenceLogHarvester } = await import('../../src/docs/coordinator/evidenceLogHarvester');
    
    const config = {
      baseDirs: this.config.evidenceDirs,
      patterns: [
        // Evidence logs pattern
        {
          name: 'safeguard-logs',
          filePattern: '**/*safeguard*.log',
          contentPatterns: [
            {
              name: 'promptId',
              pattern: /(NP-\d+|KS-\d+|IV-[A-Z]+\d*|WS\d+|CF-[A-Z0-9-]+|ST-[A-Z0-9-]+)/i,
              required: false,
            },
            {
              name: 'check',
              pattern: /\b(lint|test|build|kanban)\b/i,
              required: false,
            },
            {
              name: 'status',
              pattern: /\b(SUCCESS|FAILED|COMPLETED|ERROR|PASS|FAIL|WARNING)\b/i,
              required: false,
            },
            {
              name: 'duration',
              pattern: /(\d+(?:\.\d+)?)\s*ms|\b(\d+(?:\.\d+)?)\s*seconds?/i,
              required: false,
              transform: (matches: RegExpMatchArray) => parseFloat(matches[1] || matches[2]),
            },
          ],
          metadataExtractor: (content: string, filename: string) => {
            const metadata: Record<string, unknown> = {};
            
            // Extract prompt ID from filename if not in content
            const taskMatch = filename.match(/(NP-\d+|KS-\d+|IV-[A-Z]+\d*|WS\d+|CF-[A-Z0-9-]+|ST-[A-Z0-9-]+)/i);
            if (taskMatch) {
              metadata.promptId = taskMatch[1].toUpperCase();
            }
            
            // Extract date from filename
            const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2}|\d{8})/);
            if (dateMatch) {
              metadata.date = dateMatch[1];
            }
            
            // Parse safeguard check results
            const lines = content.split('\n');
            const checks: Record<string, CheckStatus> = {};
            
            for (const line of lines) {
              const checkMatch = line.match(/\b(lint|test|build|kanban)\b.*?\b(SUCCESS|FAILED|ERROR|PASS|FAIL|WARNING)\b/i);
              if (checkMatch) {
                const [, check, status] = checkMatch;
                checks[check.toLowerCase()] = {
                  status: this.mapStatus(status.toLowerCase()),
                  timestamp: Date.now(),
                };
                
                // Extract duration if present
                const durationMatch = line.match(/(\d+(?:\.\d+)?)\s*ms/);
                if (durationMatch) {
                  checks[check.toLowerCase()].duration = parseFloat(durationMatch[1]);
                }
              }
            }
            
            metadata.checks = checks;
            return metadata;
          },
        },
        // General evidence logs
        {
          name: 'general-evidence',
          filePattern: '**/*evidence*.log',
          contentPatterns: [
            {
              name: 'promptId',
              pattern: /(NP-\d+|KS-\d+|IV-[A-Z]+\d*|WS\d+|CF-[A-Z0-9-]+|ST-[A-Z0-9-]+)/i,
              required: false,
            },
          ],
          metadataExtractor: (content: string, filename: string) => {
            const metadata: Record<string, unknown> = {};
            
            const taskMatch = filename.match(/(NP-\d+|KS-\d+|IV-[A-Z]+\d*|WS\d+|CF-[A-Z0-9-]+|ST-[A-Z0-9-]+)/i);
            if (taskMatch) {
              metadata.promptId = taskMatch[1].toUpperCase();
            }
            
            return metadata;
          },
        },
      ],
      maxFiles: 1000,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      taskIds: this.config.promptIds,
      dateRange: this.config.dateRange,
    };

    return EvidenceLogHarvester.harvest(config);
  }

  /**
   * Process harvested evidence into safeguard results
   */
  private processEvidence(harvestResults: HarvestResults): SafeguardCheckResult[] {
    const promptMap = new Map<string, EvidenceLogEntry[]>();
    
    // Group evidence by prompt ID
    for (const entry of harvestResults.entries) {
      const promptId = entry.taskId || entry.metadata.promptId as string;
      if (!promptId) continue;
      
      if (!promptMap.has(promptId)) {
        promptMap.set(promptId, []);
      }
      promptMap.get(promptId)!.push(entry);
    }

    const results: SafeguardCheckResult[] = [];
    
    for (const [promptId, entries] of promptMap) {
      // Sort by date (newest first)
      entries.sort((a, b) => b.modifiedAt - a.modifiedAt);
      
      const latestEntry = entries[0];
      const checks = this.extractChecks(latestEntry);
      const status = this.calculateOverallStatus(checks);
      const severity = this.calculateSeverity(checks);
      const issues = this.extractIssues(checks, latestEntry);
      
      results.push({
        promptId,
        title: this.extractTitle(latestEntry),
        status,
        checks,
        lastEvidence: latestEntry.modifiedAt,
        evidencePath: latestEntry.path,
        severity,
        issues,
        metadata: latestEntry.metadata,
      });
    }

    // Sort by severity (worst first)
    results.sort((a, b) => b.severity - a.severity);
    
    return results;
  }

  /**
   * Extract check results from evidence entry
   */
  private extractChecks(entry: EvidenceLogEntry): SafeguardCheckResult['checks'] {
    const checks = entry.metadata.checks as Record<string, CheckStatus> || {};
    
    return {
      lint: this.normalizeCheck(checks.lint),
      test: this.normalizeCheck(checks.test),
      build: this.normalizeCheck(checks.build),
      kanban: this.normalizeCheck(checks.kanban),
    };
  }

  /**
   * Normalize check status
   */
  private normalizeCheck(check: CheckStatus | undefined): CheckStatus {
    if (!check) {
      return {
        status: 'unknown',
        timestamp: Date.now(),
      };
    }

    return {
      status: this.mapStatus(check.status),
      duration: check.duration,
      error: check.error,
      issues: check.issues || 0,
      timestamp: check.timestamp || Date.now(),
    };
  }

  /**
   * Map status string to standard enum
   */
  private mapStatus(status: string): CheckStatus['status'] {
    const s = (status || '').toLowerCase();
    if (s === 'success' || s === 'pass') return 'pass';
    if (s === 'failed' || s === 'fail' || s === 'error') return 'fail';
    if (s === 'warning') return 'warning';
    if (s === 'skip') return 'skip';
    return 'unknown';
  }

  /**
   * Calculate overall status from individual checks
   */
  private calculateOverallStatus(checks: SafeguardCheckResult['checks']): SafeguardCheckResult['status'] {
    const statuses = Object.values(checks).map(c => c.status);
    
    if (statuses.includes('fail')) return 'fail';
    if (statuses.includes('warning')) return 'warning';
    if (statuses.includes('pass')) return 'pass';
    return 'unknown';
  }

  /**
   * Calculate severity score
   */
  private calculateSeverity(checks: SafeguardCheckResult['checks']): number {
    let severity = 0;
    
    for (const [name, check] of Object.entries(checks)) {
      switch (check.status) {
        case 'fail':
          severity += 25;
          break;
        case 'warning':
          severity += 10;
          break;
        case 'unknown':
          severity += 5;
          break;
      }
      
      // Add penalty for long duration
      if (check.duration && check.duration > 5000) {
        severity += 5;
      }
    }
    
    return Math.min(100, severity);
  }

  /**
   * Extract issues from checks
   */
  private extractIssues(checks: SafeguardCheckResult['checks'], entry: EvidenceLogEntry): string[] {
    const issues: string[] = [];
    
    for (const [name, check] of Object.entries(checks)) {
      if (check.status === 'fail') {
        issues.push(`${name} failed: ${check.error || 'Unknown error'}`);
      } else if (check.status === 'warning') {
        issues.push(`${name} warning detected`);
      } else if (check.status === 'unknown') {
        issues.push(`${name} status unknown`);
      }
    }
    
    // Add content-based issues
    if (entry.preview.includes('ERROR') || entry.preview.includes('FAILED')) {
      issues.push('Error detected in evidence content');
    }
    
    return issues;
  }

  /**
   * Extract title from evidence entry
   */
  private extractTitle(entry: EvidenceLogEntry): string {
    // Try to get title from metadata
    if (entry.metadata.title) {
      return String(entry.metadata.title);
    }
    
    // Extract from filename
    const filename = entry.name.replace(/\.(log|md|json)$/, '');
    const parts = filename.split('-');
    if (parts.length > 1) {
      return parts.slice(1).join('-').replace(/-/g, ' ');
    }
    
    return filename;
  }

  /**
   * Generate final report
   */
  private generateReport(results: SafeguardCheckResult[]): SafeguardReport {
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const unknown = results.filter(r => r.status === 'unknown').length;
    
    const severities = results.map(r => r.severity);
    const averageSeverity = severities.length > 0 
      ? severities.reduce((a, b) => a + b, 0) / severities.length 
      : 0;
    const worstSeverity = severities.length > 0 ? Math.max(...severities) : 0;
    
    const globalIssues: string[] = [];
    if (failed > 0) {
      globalIssues.push(`${failed} prompts failed safeguard checks`);
    }
    if (warnings > 0) {
      globalIssues.push(`${warnings} prompts have warnings`);
    }
    if (unknown > 0) {
      globalIssues.push(`${unknown} prompts have unknown status`);
    }
    
    const timestamps = results.map(r => r.lastEvidence);
    const period = {
      start: timestamps.length > 0 ? Math.min(...timestamps) : Date.now(),
      end: timestamps.length > 0 ? Math.max(...timestamps) : Date.now(),
    };
    
    return {
      generatedAt: Date.now(),
      version: '1.0.0',
      summary: {
        totalPrompts: results.length,
        passed,
        failed,
        warnings,
        unknown,
        averageSeverity,
        worstSeverity,
      },
      results,
      globalIssues,
      period,
    };
  }

  /**
   * Save report to files
   */
  private async saveReport(report: SafeguardReport): Promise<void> {
    const basePath = this.config.outputPath || './test-results/safeguard-monitor-report';
    
    // Ensure output directory exists
    const outputDir = join(process.cwd(), 'test-results');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (this.config.outputFormat === 'json' || this.config.outputFormat === 'both') {
      const jsonFile = `${basePath}-${timestamp}.json`;
      writeFileSync(jsonFile, JSON.stringify(report, null, 2));
      console.log(`💾 JSON report saved to: ${jsonFile}`);
    }
    
    if (this.config.outputFormat === 'csv' || this.config.outputFormat === 'both') {
      const csvFile = `${basePath}-${timestamp}.csv`;
      const csv = this.reportToCsv(report);
      writeFileSync(csvFile, csv);
      console.log(`💾 CSV report saved to: ${csvFile}`);
    }
  }

  /**
   * Convert report to CSV format
   */
  private reportToCsv(report: SafeguardReport): string {
    const headers = [
      'promptId',
      'title',
      'status',
      'lint_status',
      'lint_duration',
      'test_status',
      'test_duration',
      'build_status',
      'build_duration',
      'kanban_status',
      'kanban_duration',
      'severity',
      'lastEvidence',
      'evidencePath',
      'issues',
    ];
    
    const rows = report.results.map(result => [
      result.promptId,
      `"${result.title.replace(/"/g, '""')}"`,
      result.status,
      result.checks.lint.status,
      result.checks.lint.duration || '',
      result.checks.test.status,
      result.checks.test.duration || '',
      result.checks.build.status,
      result.checks.build.duration || '',
      result.checks.kanban.status,
      result.checks.kanban.duration || '',
      result.severity,
      new Date(result.lastEvidence).toISOString(),
      result.evidencePath,
      `"${result.issues.join('; ').replace(/"/g, '""')}"`,
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

/**
 * CLI interface
 */
const program = new Command();

program
  .name('safeguard-monitor')
  .description('Global Safeguard Monitor Dashboard Script')
  .version('1.0.0');

program
  .command('run')
  .description('Run safeguard monitoring and generate report')
  .option('-d, --dirs <dirs>', 'Comma-separated list of evidence directories', (value) => value.split(','))
  .option('-p, --prompts <prompts>', 'Comma-separated list of prompt IDs to include', (value) => value.split(','))
  .option('-o, --output <path>', 'Output file path (without extension)')
  .option('-f, --format <format>', 'Output format (json|csv|both)', 'both')
  .option('--date-start <date>', 'Start date filter (YYYY-MM-DD)', (value) => new Date(value))
  .option('--date-end <date>', 'End date filter (YYYY-MM-DD)', (value) => new Date(value))
  .option('--warning-threshold <number>', 'Severity threshold for warnings', (value) => parseInt(value))
  .option('--critical-threshold <number>', 'Severity threshold for critical issues', (value) => parseInt(value))
  .option('-v, --verbose', 'Verbose output')
  .action(async (options: any) => {
    try {
      const config: Partial<SafeguardMonitorConfig> = {
        evidenceDirs: options.dirs,
        promptIds: options.prompts,
        outputPath: options.output,
        outputFormat: options.format,
        dateRange: (options.dateStart || options.dateEnd) ? {
          start: options.dateStart || new Date('2020-01-01'),
          end: options.dateEnd || new Date(),
        } : undefined,
        severityThresholds: {
          warning: options.warningThreshold || 30,
          critical: options.criticalThreshold || 70,
        },
      };

      const monitor = new SafeguardMonitor(config);
      const report = await monitor.run();
      
      if (options.verbose) {
        console.log('\n📊 Report Summary:');
        console.log(`  Total Prompts: ${report.summary.totalPrompts}`);
        console.log(`  Passed: ${report.summary.passed}`);
        console.log(`  Failed: ${report.summary.failed}`);
        console.log(`  Warnings: ${report.summary.warnings}`);
        console.log(`  Unknown: ${report.summary.unknown}`);
        console.log(`  Average Severity: ${report.summary.averageSeverity.toFixed(1)}`);
        console.log(`  Worst Severity: ${report.summary.worstSeverity}`);
      }
      
      if (report.summary.failed > 0) {
        console.log(`\n⚠️  ${report.summary.failed} prompts failed safeguard checks`);
        process.exit(1);
      } else {
        console.log('\n✅ All safeguards passed!');
      }
      
    } catch (error: unknown) {
      console.error('❌ Safeguard monitor failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate safeguard evidence logs')
  .option('-d, --dirs <dirs>', 'Comma-separated list of evidence directories', (value) => value.split(','))
  .action(async (options: any) => {
    try {
      const config: Partial<SafeguardMonitorConfig> = {
        evidenceDirs: options.dirs || DEFAULT_CONFIG.evidenceDirs,
      };
      
      const monitor = new SafeguardMonitor(config);
      const harvestResults = await monitor['harvestEvidence']();
      
      console.log(`📊 Found ${harvestResults.processed} evidence logs`);
      console.log(`📁 Scanned ${harvestResults.totalScanned} files`);
      console.log(`🚫 Filtered ${harvestResults.filtered} files`);
      
      if (harvestResults.errors.length > 0) {
        console.log('\n❌ Errors found:');
        harvestResults.errors.forEach(error => console.log(`  - ${error}`));
        process.exit(1);
      } else {
        console.log('\n✅ All evidence logs are valid!');
      }
      
    } catch (error: unknown) {
      console.error('❌ Validation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Export for testing
export { SafeguardMonitor as default };
