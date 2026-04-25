#!/usr/bin/env tsx

/**
 * NP-025 – Idle Village Telemetry Evidence Aggregator
 * 
 * CLI script that collects output from lint/test/build/kanban commands
 * and generates standardized evidence logs for project telemetry.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Types for telemetry evidence
interface TelemetryEvidence {
  timestamp: number;
  type: 'lint' | 'test' | 'build' | 'kanban';
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  metadata: {
    workingDirectory: string;
    nodeVersion: string;
    npmVersion: string;
    osPlatform: string;
    osArch: string;
  };
}

interface AggregatedEvidence {
  sessionId: string;
  startTime: number;
  endTime: number;
  totalDuration: number;
  evidence: TelemetryEvidence[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    errors: number;
  };
  analysis: {
    performance: {
      averageDuration: number;
      slowestCommand: string;
      fastestCommand: string;
    };
    quality: {
      errorRate: number;
      warningRate: number;
      successRate: number;
    };
    trends: {
      mostFrequentErrors: Array<{
        pattern: string;
        count: number;
        examples: string[];
      }>;
      performanceIssues: Array<{
        command: string;
        duration: number;
        threshold: number;
      }>;
    };
  };
}

interface AggregatorConfig {
  workingDirectory: string;
  outputDirectory: string;
  commands: {
    lint: string[];
    test: string[];
    build: string[];
    kanban: string[];
  };
  thresholds: {
    maxDuration: number;
    maxErrors: number;
    maxWarnings: number;
  };
  output: {
    format: 'json' | 'markdown' | 'both';
    includeRawOutput: boolean;
    includeAnalysis: boolean;
  };
}

// Default configuration
const DEFAULT_CONFIG: AggregatorConfig = {
  workingDirectory: process.cwd(),
  outputDirectory: join(process.cwd(), 'test-results', 'telemetry'),
  commands: {
    lint: ['npm', 'run', 'lint'],
    test: ['npm', 'run', 'test'],
    build: ['npm', 'run', 'build:check'],
    kanban: ['npm', 'run', 'kanban:lint'],
  },
  thresholds: {
    maxDuration: 300000, // 5 minutes
    maxErrors: 10,
    maxWarnings: 50,
  },
  output: {
    format: 'both',
    includeRawOutput: true,
    includeAnalysis: true,
  },
};

class TelemetryEvidenceAggregator {
  private config: AggregatorConfig;
  private evidence: TelemetryEvidence[] = [];
  private sessionId: string;
  private startTime: number;

  constructor(config?: Partial<AggregatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    
    // Ensure output directory exists
    if (!existsSync(this.config.outputDirectory)) {
      mkdirSync(this.config.outputDirectory, { recursive: true });
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `telemetry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Execute command and collect evidence
   */
  private async executeCommand(
    type: TelemetryEvidence['type'],
    command: string[]
  ): Promise<TelemetryEvidence> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';

      const child = spawn(command[0], command.slice(1), {
        cwd: this.config.workingDirectory,
        stdio: 'pipe',
        shell: true,
      });

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        const evidence: TelemetryEvidence = {
          timestamp: startTime,
          type,
          command: command.join(' '),
          exitCode: code || 0,
          stdout,
          stderr,
          duration,
          metadata: {
            workingDirectory: this.config.workingDirectory,
            nodeVersion: process.version,
            npmVersion: this.getNpmVersion(),
            osPlatform: process.platform,
            osArch: process.arch,
          },
        };

        resolve(evidence);
      });

      child.on('error', (error) => {
        const duration = Date.now() - startTime;
        const evidence: TelemetryEvidence = {
          timestamp: startTime,
          type,
          command: command.join(' '),
          exitCode: 1,
          stdout: '',
          stderr: error.message,
          duration,
          metadata: {
            workingDirectory: this.config.workingDirectory,
            nodeVersion: process.version,
            npmVersion: this.getNpmVersion(),
            osPlatform: process.platform,
            osArch: process.arch,
          },
        };

        resolve(evidence);
      });
    });
  }

  /**
   * Get npm version
   */
  private getNpmVersion(): string {
    try {
      const packageJsonPath = join(this.config.workingDirectory, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version || 'unknown';
      }
    } catch (error) {
      // Ignore
    }
    return 'unknown';
  }

  /**
   * Parse lint output
   */
  private parseLintOutput(evidence: TelemetryEvidence): {
    errors: number;
    warnings: number;
    files: number;
  } {
    const output = evidence.stdout + evidence.stderr;
    const errors = (output.match(/error/gi) || []).length;
    const warnings = (output.match(/warning/gi) || []).length;
    const files = (output.match(/\.(ts|tsx|js|jsx)/g) || []).length;

    return { errors, warnings, files };
  }

  /**
   * Parse test output
   */
  private parseTestOutput(evidence: TelemetryEvidence): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  } {
    const output = evidence.stdout + evidence.stderr;
    
    // Try to extract test results from common test runners
    const patterns = [
      /(\d+)\s+passed/gi,
      /(\d+)\s+failed/gi,
      /(\d+)\s+skipped/gi,
      /(\d+)\s+total/gi,
      /✓\s+(\d+)/gi,
      /✗\s+(\d+)/gi,
    ];

    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    patterns.forEach(pattern => {
      const matches = output.match(pattern);
      if (matches) {
        const count = parseInt(matches[matches.length - 1].match(/\d+/)?.[0] || '0');
        if (pattern.toString().includes('passed') || pattern.toString().includes('✓')) {
          passed = Math.max(passed, count);
        } else if (pattern.toString().includes('failed') || pattern.toString().includes('✗')) {
          failed = Math.max(failed, count);
        } else if (pattern.toString().includes('skipped')) {
          skipped = Math.max(skipped, count);
        } else if (pattern.toString().includes('total')) {
          total = Math.max(total, count);
        }
      }
    });

    // If we can't parse the output, make reasonable assumptions
    if (total === 0) {
      total = passed + failed + skipped;
    }

    return { total, passed, failed, skipped };
  }

  /**
   * Parse build output
   */
  private parseBuildOutput(evidence: TelemetryEvidence): {
    errors: number;
    warnings: number;
    success: boolean;
  } {
    const output = evidence.stdout + evidence.stderr;
    const errors = (output.match(/error/gi) || []).length;
    const warnings = (output.match(/warning/gi) || []).length;
    const success = evidence.exitCode === 0 && !output.toLowerCase().includes('error');

    return { errors, warnings, success };
  }

  /**
   * Parse kanban output
   */
  private parseKanbanOutput(evidence: TelemetryEvidence): {
    prompts: number;
    validated: number;
    failed: number;
    warnings: number;
  } {
    const output = evidence.stdout + evidence.stderr;
    const prompts = (output.match(/prompt/gi) || []).length;
    const validated = (output.match(/validated/gi) || []).length;
    const failed = (output.match(/failed/gi) || []).length;
    const warnings = (output.match(/warning/gi) || []).length;

    return { prompts, validated, failed, warnings };
  }

  /**
   * Collect all evidence
   */
  async collectEvidence(): Promise<void> {
    console.log(`🔍 Starting telemetry evidence collection...`);
    console.log(`📁 Working directory: ${this.config.workingDirectory}`);
    console.log(`🆔 Session ID: ${this.sessionId}`);

    const commandTypes: Array<{ type: TelemetryEvidence['type']; commands: string[] }> = [
      { type: 'lint', commands: this.config.commands.lint },
      { type: 'test', commands: this.config.commands.test },
      { type: 'build', commands: this.config.commands.build },
      { type: 'kanban', commands: this.config.commands.kanban },
    ];

    for (const { type, commands } of commandTypes) {
      console.log(`\n🔄 Running ${type} commands...`);
      
      for (const command of commands) {
        console.log(`  📋 Executing: ${command}`);
        
        try {
          const evidence = await this.executeCommand(type, command.split(' '));
          this.evidence.push(evidence);
          
          const status = evidence.exitCode === 0 ? '✅' : '❌';
          const duration = (evidence.duration / 1000).toFixed(2);
          console.log(`    ${status} ${command} (${duration}s)`);
          
          // Check thresholds
          if (evidence.duration > this.config.thresholds.maxDuration) {
            console.log(`    ⚠️  Slow execution: ${duration}s > ${this.config.thresholds.maxDuration / 1000}s`);
          }
        } catch (error) {
          console.log(`    ❌ Failed to execute: ${error}`);
        }
      }
    }

    console.log(`\n✅ Evidence collection completed. Collected ${this.evidence.length} evidence items.`);
  }

  /**
   * Analyze collected evidence
   */
  public analyzeEvidence(): AggregatedEvidence['analysis'] {
    const performance = {
      averageDuration: this.evidence.reduce((sum, e) => sum + e.duration, 0) / this.evidence.length,
      slowestCommand: '',
      fastestCommand: '',
    };

    const slowest = this.evidence.reduce((max, e) => e.duration > max.duration ? e : max);
    const fastest = this.evidence.reduce((min, e) => e.duration < min.duration ? e : min);
    
    performance.slowestCommand = `${slowest.command} (${slowest.duration}ms)`;
    performance.fastestCommand = `${fastest.command} (${fastest.duration}ms)`;

    const totalErrors = this.evidence.reduce((sum, e) => {
      if (e.type === 'lint') return sum + this.parseLintOutput(e).errors;
      if (e.type === 'build') return sum + this.parseBuildOutput(e).errors;
      return sum + (e.exitCode > 0 ? 1 : 0);
    }, 0);

    const totalWarnings = this.evidence.reduce((sum, e) => {
      if (e.type === 'lint') return sum + this.parseLintOutput(e).warnings;
      if (e.type === 'build') return sum + this.parseBuildOutput(e).warnings;
      return sum;
    }, 0);

    const quality = {
      errorRate: totalErrors / this.evidence.length,
      warningRate: totalWarnings / this.evidence.length,
      successRate: this.evidence.filter(e => e.exitCode === 0).length / this.evidence.length,
    };

    // Extract error patterns
    const errorPatterns = new Map<string, { count: number; examples: string[] }>();
    
    this.evidence.forEach(e => {
      const output = e.stderr || e.stdout;
      const lines = output.split('\n').filter(line => 
        line.toLowerCase().includes('error') || 
        line.toLowerCase().includes('failed') ||
        line.toLowerCase().includes('warning')
      );
      
      lines.forEach(line => {
        const pattern = line.substring(0, 100); // First 100 chars as pattern
        const existing = errorPatterns.get(pattern);
        if (existing) {
          existing.count++;
          if (existing.examples.length < 3) {
            existing.examples.push(line.trim());
          }
        } else {
          errorPatterns.set(pattern, {
            count: 1,
            examples: [line.trim()],
          });
        }
      });
    });

    const mostFrequentErrors = Array.from(errorPatterns.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        examples: data.examples,
      }));

    const performanceIssues = this.evidence
      .filter(e => e.duration > this.config.thresholds.maxDuration)
      .map(e => ({
        command: e.command,
        duration: e.duration,
        threshold: this.config.thresholds.maxDuration,
      }));

    return {
      performance,
      quality,
      trends: {
        mostFrequentErrors,
        performanceIssues,
      },
    };
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(): AggregatedEvidence['summary'] {
    const summary = {
      total: this.evidence.length,
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: 0,
    };

    this.evidence.forEach(e => {
      if (e.exitCode === 0) {
        summary.passed++;
      } else {
        summary.failed++;
      }

      if (e.type === 'lint') {
        const lint = this.parseLintOutput(e);
        summary.errors += lint.errors;
        summary.warnings += lint.warnings;
      } else if (e.type === 'build') {
        const build = this.parseBuildOutput(e);
        summary.errors += build.errors;
        summary.warnings += build.warnings;
      }
    });

    return summary;
  }

  /**
   * Generate aggregated evidence
   */
  private generateAggregatedEvidence(): AggregatedEvidence {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime,
      totalDuration,
      evidence: this.config.output.includeRawOutput ? this.evidence : [],
      summary: this.generateSummary(),
      analysis: this.config.output.includeAnalysis ? this.analyzeEvidence() : {
        performance: { averageDuration: 0, slowestCommand: '', fastestCommand: '' },
        quality: { errorRate: 0, warningRate: 0, successRate: 0 },
        trends: { mostFrequentErrors: [], performanceIssues: [] },
      },
    };
  }

  /**
   * Generate JSON output
   */
  private generateJSONOutput(aggregated: AggregatedEvidence): string {
    return JSON.stringify(aggregated, null, 2);
  }

  /**
   * Generate Markdown output
   */
  private generateMarkdownOutput(aggregated: AggregatedEvidence): string {
    const { summary, analysis, evidence } = aggregated;
    const duration = (aggregated.totalDuration / 1000).toFixed(2);

    let markdown = `# Telemetry Evidence Report\n\n`;
    markdown += `**Session ID**: ${aggregated.sessionId}\n`;
    markdown += `**Generated**: ${new Date(aggregated.endTime).toISOString()}\n`;
    markdown += `**Duration**: ${duration}s\n\n`;

    // Summary
    markdown += `## Summary\n\n`;
    markdown += `| Metric | Count |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Commands | ${summary.total} |\n`;
    markdown += `| Passed | ${summary.passed} |\n`;
    markdown += `| Failed | ${summary.failed} |\n`;
    markdown += `| Errors | ${summary.errors} |\n`;
    markdown += `| Warnings | ${summary.warnings} |\n\n`;

    // Performance Analysis
    if (this.config.output.includeAnalysis) {
      markdown += `## Performance Analysis\n\n`;
      markdown += `**Average Duration**: ${(analysis.performance.averageDuration / 1000).toFixed(2)}s\n`;
      markdown += `**Slowest Command**: ${analysis.performance.slowestCommand}\n`;
      markdown += `**Fastest Command**: ${analysis.performance.fastestCommand}\n\n`;

      markdown += `### Quality Metrics\n\n`;
      markdown += `**Success Rate**: ${(analysis.quality.successRate * 100).toFixed(1)}%\n`;
      markdown += `**Error Rate**: ${(analysis.quality.errorRate * 100).toFixed(1)}%\n`;
      markdown += `**Warning Rate**: ${(analysis.quality.warningRate * 100).toFixed(1)}%\n\n`;

      // Error Patterns
      if (analysis.trends.mostFrequentErrors.length > 0) {
        markdown += `### Most Frequent Errors\n\n`;
        analysis.trends.mostFrequentErrors.forEach((error, index) => {
          markdown += `#### ${index + 1}. ${error.pattern} (${error.count} occurrences)\n`;
          error.examples.forEach(example => {
            markdown += `- \`${example}\`\n`;
          });
          markdown += `\n`;
        });
      }

      // Performance Issues
      if (analysis.trends.performanceIssues.length > 0) {
        markdown += `### Performance Issues\n\n`;
        analysis.trends.performanceIssues.forEach(issue => {
          markdown += `- **${issue.command}**: ${(issue.duration / 1000).toFixed(2)}s (threshold: ${(issue.threshold / 1000).toFixed(2)}s)\n`;
        });
        markdown += `\n`;
      }
    }

    // Detailed Evidence
    if (this.config.output.includeRawOutput) {
      markdown += `## Detailed Evidence\n\n`;
      evidence.forEach((e, index) => {
        markdown += `### ${index + 1}. ${e.type.toUpperCase()}: ${e.command}\n\n`;
        markdown += `**Timestamp**: ${new Date(e.timestamp).toISOString()}\n`;
        markdown += `**Duration**: ${(e.duration / 1000).toFixed(2)}s\n`;
        markdown += `**Exit Code**: ${e.exitCode}\n\n`;

        if (e.stdout) {
          markdown += `#### stdout\n`;
          markdown += '```\n';
          markdown += e.stdout.substring(0, 1000);
          if (e.stdout.length > 1000) {
            markdown += '\n... (truncated)';
          }
          markdown += '\n```\n\n';
        }

        if (e.stderr) {
          markdown += `#### stderr\n`;
          markdown += '```\n';
          markdown += e.stderr.substring(0, 1000);
          if (e.stderr.length > 1000) {
            markdown += '\n... (truncated)';
          }
          markdown += '\n```\n\n';
        }

        markdown += `---\n\n`;
      });
    }

    return markdown;
  }

  /**
   * Save output files
   */
  private async saveOutput(aggregated: AggregatedEvidence): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `telemetry-evidence-${timestamp}`;

    if (this.config.output.format === 'json' || this.config.output.format === 'both') {
      const jsonPath = join(this.config.outputDirectory, `${baseFilename}.json`);
      const jsonContent = this.generateJSONOutput(aggregated);
      writeFileSync(jsonPath, jsonContent, 'utf8');
      console.log(`📄 JSON report saved: ${jsonPath}`);
    }

    if (this.config.output.format === 'markdown' || this.config.output.format === 'both') {
      const mdPath = join(this.config.outputDirectory, `${baseFilename}.md`);
      const mdContent = this.generateMarkdownOutput(aggregated);
      writeFileSync(mdPath, mdContent, 'utf8');
      console.log(`📄 Markdown report saved: ${mdPath}`);
    }
  }

  /**
   * Run the complete aggregation process
   */
  async run(): Promise<void> {
    try {
      await this.collectEvidence();
      
      const aggregated = this.generateAggregatedEvidence();
      await this.saveOutput(aggregated);

      console.log(`\n🎉 Telemetry evidence aggregation completed successfully!`);
      console.log(`📊 Summary: ${aggregated.summary.passed}/${aggregated.summary.total} commands passed`);
      
      if (aggregated.summary.errors > 0) {
        console.log(`⚠️  Found ${aggregated.summary.errors} errors`);
      }
      
      if (aggregated.summary.warnings > 0) {
        console.log(`⚠️  Found ${aggregated.summary.warnings} warnings`);
      }

    } catch (error) {
      console.error(`❌ Telemetry aggregation failed:`, error);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const config: Partial<AggregatorConfig> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        console.log(`
NP-025 Telemetry Evidence Aggregator

Usage: tsx TelemetryEvidenceAggregator.ts [options]

Options:
  --help, -h              Show this help message
  --working-dir, -w       Working directory (default: current directory)
  --output-dir, -o        Output directory (default: ./test-results/telemetry)
  --format, -f            Output format: json, markdown, both (default: both)
  --no-raw-output         Exclude raw command output from reports
  --no-analysis           Exclude analysis from reports
  --max-duration          Maximum duration threshold in ms (default: 300000)
  --max-errors            Maximum error threshold (default: 10)
  --max-warnings          Maximum warning threshold (default: 50)

Examples:
  tsx TelemetryEvidenceAggregator.ts
  tsx TelemetryEvidenceAggregator.ts --format json --no-raw-output
  tsx TelemetryEvidenceAggregator.ts --working-dir /path/to/project --output-dir /path/to/output
        `);
        process.exit(0);
        
      case '--working-dir':
      case '-w':
        config.workingDirectory = args[++i];
        break;
        
      case '--output-dir':
      case '-o':
        config.outputDirectory = args[++i];
        break;
        
      case '--format':
      case '-f':
        const format = args[++i] as 'json' | 'markdown' | 'both';
        if (['json', 'markdown', 'both'].includes(format)) {
          config.output = { ...DEFAULT_CONFIG.output, format };
        } else {
          console.error(`Invalid format: ${format}`);
          process.exit(1);
        }
        break;
        
      case '--no-raw-output':
        config.output = { ...DEFAULT_CONFIG.output, includeRawOutput: false };
        break;
        
      case '--no-analysis':
        config.output = { ...DEFAULT_CONFIG.output, includeAnalysis: false };
        break;
        
      case '--max-duration':
        config.thresholds = { ...DEFAULT_CONFIG.thresholds, maxDuration: parseInt(args[++i]) };
        break;
        
      case '--max-errors':
        config.thresholds = { ...DEFAULT_CONFIG.thresholds, maxErrors: parseInt(args[++i]) };
        break;
        
      case '--max-warnings':
        config.thresholds = { ...DEFAULT_CONFIG.thresholds, maxWarnings: parseInt(args[++i]) };
        break;
        
      default:
        console.error(`Unknown option: ${arg}`);
        console.log('Use --help for available options');
        process.exit(1);
    }
  }

  // Run the aggregator
  const aggregator = new TelemetryEvidenceAggregator(config);
  await aggregator.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { TelemetryEvidenceAggregator, type TelemetryEvidence, type AggregatedEvidence, type AggregatorConfig };
