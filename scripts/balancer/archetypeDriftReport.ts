#!/usr/bin/env tsx

/**
 * NP-055 – Balancer Archetype Drift Report CLI
 * 
 * Sentinel-Balancer – Drift QA CLI tool for generating archetype
 * drift reports between releases. Compares weight snapshots and KPI,
 * calculates delta percentages and severity, and saves reports in JSON/Markdown.
 * 
 * @since 2026-01-20
 * @author Cascade
 */

import { Command } from 'commander';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { 
  ArchetypeDriftDetector,
  createArchetypeDriftDetector,
} from '../../src/balancing/analytics/ArchetypeDriftDetector';

type ArchetypeDriftDetectionSchema = ReturnType<ArchetypeDriftDetector['analyzeDrift']>;
type ArchetypeDriftDetectedTelemetryPayload = Parameters<ArchetypeDriftDetector['sendTelemetryEvent']>[0];

// CLI Options Interface
interface CLIOptions {
  output: string;
  format: 'json' | 'markdown';
  threshold: number;
  severityLow: number;
  severityMedium: number;
  severityHigh: number;
  severityCritical: number;
  verbose: boolean;
  dryRun: boolean;
  exitCode: boolean;
  config?: string;
}

/**
 * Archetype drift report results structure.
 */
interface ArchetypeDriftReportResults {
  /** Report configuration */
  config: {
    weightChangeThreshold: number;
    severityThresholds: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    minSampleCount: number;
    includeDerivedStats: boolean;
    verbose: boolean;
  };
  /** Detection results */
  detection: ArchetypeDriftDetectionSchema;
  /** Report timestamp */
  timestamp: number;
  /** Process information */
  processInfo: {
    pid: number;
    nodeVersion: string;
    platform: string;
    arch: string;
  };
  /** Performance metrics */
  performance: {
    reportGenerationMs: number;
    baselineLoadMs: number;
    currentSnapshotMs: number;
    analysisMs: number;
  };
  /** Recommendations */
  recommendations: string[];
  /** Exit code recommendation */
  exitCode: number;
}

/**
 * Archetype drift report runner class.
 */
class ArchetypeDriftReportRunner {
  private options: CLIOptions;
  private detector: ArchetypeDriftDetector;
  private startTime: number;
  private endTime: number = 0;

  constructor(options: CLIOptions) {
    this.options = options;
    this.startTime = Date.now();
    
    // Create drift detector with CLI configuration
    const detectorConfig = {
      weightChangeThreshold: options.threshold,
      severityThresholds: {
        low: options.severityLow,
        medium: options.severityMedium,
        high: options.severityHigh,
        critical: options.severityCritical,
      },
      minSampleCount: 2,
      includeDerivedStats: true,
      verbose: options.verbose,
    };

    this.detector = createArchetypeDriftDetector(detectorConfig);
  }

  /**
   * Execute the drift report generation.
   */
  async run(): Promise<ArchetypeDriftReportResults> {
    if (this.options.verbose) {
      console.log('🚀 Starting archetype drift report generation...');
      console.log(`📊 Threshold: ${this.options.threshold}`);
      console.log(`📈 Severity thresholds: Low=${this.options.severityLow}, Medium=${this.options.severityMedium}, High=${this.options.severityHigh}, Critical=${this.options.severityCritical}`);
    }

    const baselineLoadStart = Date.now();
    
    // Load baseline snapshot
    await this.detector.loadBaseline();
    
    const baselineLoadMs = Date.now() - baselineLoadStart;
    
    const snapshotStart = Date.now();
    
    // Create current snapshot
    await this.detector.createCurrentSnapshot();
    
    const currentSnapshotMs = Date.now() - snapshotStart;
    
    const analysisStart = Date.now();
    
    // Analyze drift
    const detection = this.detector.analyzeDrift();
    
    const analysisMs = Date.now() - analysisStart;
    this.endTime = Date.now();

    // Generate recommendations
    const recommendations = this.generateRecommendations(detection);
    const exitCode = this.calculateExitCode(detection);

    const results: ArchetypeDriftReportResults = {
      config: {
        weightChangeThreshold: this.options.threshold,
        severityThresholds: {
          low: this.options.severityLow,
          medium: this.options.severityMedium,
          high: this.options.severityHigh,
          critical: this.options.severityCritical,
        },
        minSampleCount: 2,
        includeDerivedStats: true,
        verbose: this.options.verbose,
      },
      detection,
      timestamp: this.startTime,
      processInfo: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      performance: {
        reportGenerationMs: this.endTime - this.startTime,
        baselineLoadMs,
        currentSnapshotMs,
        analysisMs,
      },
      recommendations,
      exitCode,
    };

    if (this.options.verbose) {
      this.logResults(results);
    }

    return results;
  }

  /**
   * Generate recommendations based on detection results.
   */
  private generateRecommendations(detection: ArchetypeDriftDetectionSchema): string[] {
    const recommendations: string[] = [];

    if (detection.severity === 'none') {
      recommendations.push('No significant archetype drift detected');
      recommendations.push('Continue monitoring with regular reports');
      return recommendations;
    }

    // Add recommendations based on severity
    if (detection.severity === 'critical') {
      recommendations.push('CRITICAL: Immediate attention required for archetype drift');
      recommendations.push('Review and potentially revert recent weight changes');
      recommendations.push('Consider emergency rollback to stable configuration');
    } else if (detection.severity === 'high') {
      recommendations.push('HIGH: Significant archetype drift detected');
      recommendations.push('Review recent configuration changes');
      recommendations.push('Consider adjusting weight thresholds');
    } else if (detection.severity === 'medium') {
      recommendations.push('MEDIUM: Moderate archetype drift detected');
      recommendations.push('Monitor trends and consider adjustments');
    } else {
      recommendations.push('LOW: Minor archetype drift detected');
      recommendations.push('Continue monitoring and document changes');
    }

    // Add specific archetype recommendations
    const criticalArchetypes = detection.driftedArchetypes.filter(a => a.severity === 'critical');
    if (criticalArchetypes.length > 0) {
      recommendations.push(`Critical archetypes: ${criticalArchetypes.map(a => a.archetypeId).join(', ')}`);
    }

    // Add global weight change recommendations
    if (Object.keys(detection.globalWeightChanges).length > 0) {
      recommendations.push('Global weight changes detected - review BalancerConfig');
    }

    // Add derived stat recommendations
    if (detection.derivedStatsChanges.length > 0) {
      recommendations.push(`Derived stats affected: ${detection.derivedStatsChanges.join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Calculate appropriate exit code.
   */
  private calculateExitCode(detection: ArchetypeDriftDetectionSchema): number {
    if (!this.options.exitCode) {
      return 0;
    }

    // Critical drift detected
    if (detection.severity === 'critical') {
      return 2;
    }

    // High drift detected
    if (detection.severity === 'high') {
      return 1;
    }

    // Medium drift detected
    if (detection.severity === 'medium') {
      return 1;
    }

    // No significant drift
    return 0;
  }

  /**
   * Log results to console.
   */
  private logResults(results: ArchetypeDriftReportResults): void {
    console.log('\n📋 Archetype Drift Report Results:');
    console.log(`   Severity: ${results.detection.severity.toUpperCase()}`);
    console.log(`   Total Archetypes: ${results.detection.totalArchetypes}`);
    console.log(`   Drifted Archetypes: ${results.detection.driftedArchetypes.length}`);
    console.log(`   Global Weight Changes: ${Object.keys(results.detection.globalWeightChanges).length}`);
    console.log(`   Derived Stats Changes: ${results.detection.derivedStatsChanges.length}`);

    if (results.detection.driftedArchetypes.length > 0) {
      console.log(`\n⚠️  Top Drifted Archetypes:`);
      results.detection.driftedArchetypes.slice(0, 5).forEach((archetype, index) => {
        console.log(`   ${index + 1}. ${archetype.archetypeId}: ${archetype.driftPercentage.toFixed(2)}% (${archetype.severity})`);
      });
    } else {
      console.log(`\n✅ No significant drift detected`);
    }

    console.log(`\n💡 Recommendations:`);
    results.recommendations.forEach(rec => {
      console.log(`   - ${rec}`);
    });

    console.log(`\n⏱️  Performance:`);
    console.log(`   Report Generation: ${results.performance.reportGenerationMs}ms`);
    console.log(`   Baseline Load: ${results.performance.baselineLoadMs}ms`);
    console.log(`   Current Snapshot: ${results.performance.currentSnapshotMs}ms`);
    console.log(`   Analysis: ${results.performance.analysisMs}ms`);

    if (this.options.exitCode) {
      console.log(`\n🚪 Exit Code: ${results.exitCode}`);
    }
  }

  /**
   * Export results to JSON format.
   */
  exportToJSON(results: ArchetypeDriftReportResults): string {
    return JSON.stringify({
      report: results,
      exportMetadata: {
        exportedAt: Date.now(),
        exportedBy: 'archetype-drift-report-cli',
        format: 'json',
        version: '1.0.0',
      },
    }, null, 2);
  }

  /**
   * Export results to Markdown format.
   */
  exportToMarkdown(results: ArchetypeDriftReportResults): string {
    const lines = [
      `# Archetype Drift Report`,
      '',
      `**Report Generated:** ${new Date(results.timestamp).toISOString()}`,
      `**Process ID:** ${results.processInfo.pid}`,
      `**Node Version:** ${results.processInfo.nodeVersion}`,
      `**Platform:** ${results.processInfo.platform} (${results.processInfo.arch})`,
      '',
      `## Configuration`,
      '',
      `- **Weight Change Threshold:** ${results.config.weightChangeThreshold}`,
      `- **Severity Thresholds:**`,
      `  - Low: ${results.config.severityThresholds.low}`,
      `  - Medium: ${results.config.severityThresholds.medium}`,
      `  - High: ${results.config.severityThresholds.high}`,
      `  - Critical: ${results.config.severityThresholds.critical}`,
      `- **Minimum Sample Count:** ${results.config.minSampleCount}`,
      `- **Include Derived Stats:** ${results.config.includeDerivedStats}`,
      '',
      `## Detection Summary`,
      '',
      `- **Overall Severity:** ${results.detection.severity.toUpperCase()}`,
      `- **Total Archetypes:** ${results.detection.totalArchetypes}`,
      `- **Drifted Archetypes:** ${results.detection.driftedArchetypes.length}`,
      `- **Global Weight Changes:** ${Object.keys(results.detection.globalWeightChanges).length}`,
      `- **Derived Stats Changes:** ${results.detection.derivedStatsChanges.length}`,
      '',
    ];

    if (results.detection.driftedArchetypes.length > 0) {
      lines.push(
        `## Drifted Archetypes`,
        '',
        `| Archetype ID | Drift % | Severity | Affected Stats | Recommendations |`,
        `|-------------|---------|----------|---------------|----------------|`,
      );

      results.detection.driftedArchetypes.forEach(archetype => {
        const affectedStats = archetype.affectedStats.slice(0, 3).join(', ') + 
          (archetype.affectedStats.length > 3 ? '...' : '');
        const recommendations = archetype.recommendations.slice(0, 2).join('; ') + 
          (archetype.recommendations.length > 2 ? '...' : '');
        
        lines.push(
          `| ${archetype.archetypeId} | ${archetype.driftPercentage.toFixed(2)}% | ${archetype.severity.toUpperCase()} | ${affectedStats} | ${recommendations} |`
        );
      });
      lines.push('');
    }

    if (Object.keys(results.detection.globalWeightChanges).length > 0) {
      lines.push(
        `## Global Weight Changes`,
        '',
        `| Stat | Change % |`,
        `|------|---------|`,
      );

      Object.entries(results.detection.globalWeightChanges).forEach(([statId, change]) => {
        lines.push(`| ${statId} | ${change.toFixed(2)}% |`);
      });
      lines.push('');
    }

    if (results.detection.derivedStatsChanges.length > 0) {
      lines.push(
        `## Derived Stats Changes`,
        '',
        results.detection.derivedStatsChanges.map(stat => `- ${stat}`).join('\n'),
        ''
      );
    }

    lines.push(
      `## Performance Metrics`,
      '',
      `- **Report Generation:** ${results.performance.reportGenerationMs}ms`,
      `- **Baseline Load:** ${results.performance.baselineLoadMs}ms`,
      `- **Current Snapshot:** ${results.performance.currentSnapshotMs}ms`,
      `- **Analysis:** ${results.performance.analysisMs}ms`,
      '',
      `## Recommendations`,
      ''
    );

    results.recommendations.forEach(rec => {
      lines.push(`- ${rec}`);
    });

    lines.push(
      '',
      `## Exit Code`,
      '',
      `${results.exitCode}`,
      '',
      `---`,
      '',
      `*Generated by Archetype Drift Report CLI v1.0.0*`
    );

    return lines.join('\n');
  }
}

// CLI Setup
const program = new Command();

program
  .name('archetype-drift-report')
  .description('CLI tool for archetype drift detection and reporting')
  .version('1.0.0');

program
  .requiredOption('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json|markdown)', 'markdown')
  .option('-t, --threshold <threshold>', 'Weight change threshold (0.01-1.0)', (value) => parseFloat(value), 0.1)
  .option('--severity-low <threshold>', 'Low severity threshold (0.05-0.2)', (value) => parseFloat(value), 0.05)
  .option('--severity-medium <threshold>', 'Medium severity threshold (0.2-0.5)', (value) => parseFloat(value), 0.2)
  .option('--severity-high <threshold>', 'High severity threshold (0.5-0.8)', (value) => parseFloat(value), 0.5)
  .option('--severity-critical <threshold>', 'Critical severity threshold (0.8-1.0)', (value) => parseFloat(value), 0.8)
  .option('-v, --verbose', 'Enable verbose output')
  .option('--dry-run', 'Show what would be exported without writing files')
  .option('--exit-code', 'Set exit code based on detection results')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (options) => {
    try {
      const runner = new ArchetypeDriftReportRunner(options);
      const results = await runner.run();

      let output: string;
      let fileSizeBytes: number;

      if (options.format === 'json') {
        output = runner.exportToJSON(results);
        fileSizeBytes = Buffer.byteLength(output, 'utf8');
      } else {
        output = runner.exportToMarkdown(results);
        fileSizeBytes = Buffer.byteLength(output, 'utf8');
      }

      // Create output directory if needed
      const outputDir = dirname(options.output);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Write file (unless dry run)
      if (!options.dryRun) {
        writeFileSync(options.output, output, 'utf8');
        if (options.verbose) {
          console.log(`✅ Results exported to: ${options.output}`);
          console.log(`📁 File size: ${(fileSizeBytes / 1024).toFixed(2)} KB`);
        }
      } else {
        console.log(`🔍 Dry run - would write to: ${options.output}`);
        console.log(`📁 File size: ${(fileSizeBytes / 1024).toFixed(2)} KB`);
      }

      // Exit with appropriate code
      if (options.exitCode) {
        process.exit(results.exitCode);
      }

    } catch (error) {
      console.error('❌ Archetype drift report failed:', error);
      process.exit(1);
    }
  });

// Run CLI
if (require.main === module) {
  program.parse();
}

export { ArchetypeDriftReportRunner };
