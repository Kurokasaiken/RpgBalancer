#!/usr/bin/env tsx

/**
 * NP-050 – Analytics Memory Leak Sweep CLI
 * 
 * CLI script for periodic memory leak detection and analysis.
 * Performs memory sweeps, saves logs in JSON/Markdown format,
 * and sends appropriate exit codes based on detection results.
 * 
 * @since 2026-01-20
 * @author Cascade
 */

import { Command } from 'commander';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { 
  MemoryLeakGuard, 
  createMemoryLeakGuard,
  type MemoryLeakGuardConfig,
  type MemoryLeakDetection,
} from '../../src/analytics/memory/memoryLeakGuard';

// CLI Options Interface
interface CLIOptions {
  output: string;
  format: 'json' | 'markdown';
  duration: number;
  threshold: number;
  samplingInterval: number;
  growthRateThreshold: number;
  verbose: boolean;
  dryRun: boolean;
  exitCode: boolean;
  config?: string;
}

/**
 * Memory sweep results structure.
 */
interface MemorySweepResults {
  /** Sweep configuration */
  config: MemoryLeakGuardConfig;
  /** Sweep duration in milliseconds */
  durationMs: number;
  /** Total samples collected */
  totalSamples: number;
  /** Memory leak detection result */
  detection: MemoryLeakDetection | null;
  /** Sweep timestamp */
  timestamp: number;
  /** Process information */
  processInfo: {
    pid: number;
    nodeVersion: string;
    platform: string;
    arch: string;
  };
  /** Memory statistics */
  memoryStats: {
    initialMemoryMB: number;
    finalMemoryMB: number;
    peakMemoryMB: number;
    averageMemoryMB: number;
    memoryGrowthMB: number;
    memoryGrowthRate: number;
  };
  /** Performance metrics */
  performance: {
    sweepDurationMs: number;
    averageSampleIntervalMs: number;
    samplesPerSecond: number;
  };
  /** Recommendations */
  recommendations: string[];
  /** Exit code recommendation */
  exitCode: number;
}

/**
 * Memory sweep runner class.
 */
class MemorySweepRunner {
  private options: CLIOptions;
  private guard: MemoryLeakGuard;
  private startTime: number;
  private endTime: number = 0;
  private initialMemory: number = 0;
  private peakMemory: number = 0;
  private memorySamples: number[] = [];

  constructor(options: CLIOptions) {
    this.options = options;
    this.startTime = Date.now();
    
    // Create memory leak guard with CLI configuration
    const guardConfig: Partial<MemoryLeakGuardConfig> = {
      thresholdMB: options.threshold,
      samplingIntervalMs: options.samplingInterval,
      growthRateThreshold: options.growthRateThreshold,
      verbose: options.verbose,
    };

    this.guard = createMemoryLeakGuard(guardConfig);
  }

  /**
   * Execute the memory sweep.
   */
  async run(): Promise<MemorySweepResults> {
    if (this.options.verbose) {
      console.log('🚀 Starting memory leak sweep...');
      console.log(`📊 Duration: ${this.options.duration}ms`);
      console.log(`🔍 Threshold: ${this.options.threshold}MB`);
      console.log(`📈 Sampling interval: ${this.options.samplingInterval}ms`);
      console.log(`⚡ Growth rate threshold: ${(this.options.growthRateThreshold * 100).toFixed(2)}%`);
    }

    // Record initial memory
    const initialSnapshot = this.guard.getCurrentSnapshot();
    this.initialMemory = initialSnapshot?.memoryMB || 0;
    this.peakMemory = this.initialMemory;

    // Start monitoring
    this.guard.start();

    // Run for specified duration
    await this.waitForDuration(this.options.duration);

    // Stop monitoring
    this.guard.stop();
    this.endTime = Date.now();

    // Collect final data
    const state = this.guard.getState();
    const detection = state.lastDetection;

    // Calculate statistics
    const memoryStats = this.calculateMemoryStats();
    const performance = this.calculatePerformanceStats(state);
    const recommendations = this.generateRecommendations(detection, memoryStats);
    const exitCode = this.calculateExitCode(detection, memoryStats);

    const results: MemorySweepResults = {
      config: state.config,
      durationMs: this.options.duration,
      totalSamples: state.totalSamples,
      detection,
      timestamp: this.startTime,
      processInfo: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      memoryStats,
      performance,
      recommendations,
      exitCode,
    };

    if (this.options.verbose) {
      this.logResults(results);
    }

    return results;
  }

  /**
   * Wait for specified duration while collecting memory samples.
   */
  private async waitForDuration(durationMs: number): Promise<void> {
    const endTime = Date.now() + durationMs;
    
    while (Date.now() < endTime) {
      // Collect memory sample
      const snapshot = this.guard.getCurrentSnapshot();
      if (snapshot) {
        this.memorySamples.push(snapshot.memoryMB);
        this.peakMemory = Math.max(this.peakMemory, snapshot.memoryMB);
      }
      
      // Wait for next sampling interval
      await new Promise(resolve => setTimeout(resolve, Math.min(1000, this.options.samplingInterval)));
    }
  }

  /**
   * Calculate memory statistics.
   */
  private calculateMemoryStats(): MemorySweepResults['memoryStats'] {
    const finalMemory = this.memorySamples.length > 0 
      ? this.memorySamples[this.memorySamples.length - 1] 
      : this.initialMemory;
    
    const averageMemory = this.memorySamples.length > 0
      ? this.memorySamples.reduce((sum, mem) => sum + mem, 0) / this.memorySamples.length
      : this.initialMemory;
    
    const memoryGrowth = finalMemory - this.initialMemory;
    const memoryGrowthRate = this.initialMemory > 0 ? memoryGrowth / this.initialMemory : 0;

    return {
      initialMemoryMB: this.initialMemory,
      finalMemoryMB: finalMemory,
      peakMemoryMB: this.peakMemory,
      averageMemoryMB: averageMemory,
      memoryGrowthMB: memoryGrowth,
      memoryGrowthRate,
    };
  }

  /**
   * Calculate performance statistics.
   */
  private calculatePerformanceStats(state: { totalSamples: number }): MemorySweepResults['performance'] {
    const sweepDuration = this.endTime - this.startTime;
    const averageSampleInterval = state.totalSamples > 0 ? sweepDuration / state.totalSamples : 0;
    const samplesPerSecond = state.totalSamples > 0 ? (state.totalSamples / sweepDuration) * 1000 : 0;

    return {
      sweepDurationMs: sweepDuration,
      averageSampleIntervalMs: averageSampleInterval,
      samplesPerSecond,
    };
  }

  /**
   * Generate recommendations based on detection results and memory stats.
   */
  private generateRecommendations(
    detection: MemoryLeakDetection | null,
    memoryStats: MemorySweepResults['memoryStats']
  ): string[] {
    const recommendations: string[] = [];
    const currentState = this.guard.getState();

    if (detection && detection.detected) {
      recommendations.push(...detection.recommendations);
    }

    // Add recommendations based on memory growth
    if (memoryStats.memoryGrowthRate > 0.1) {
      recommendations.push('Memory growth detected during sweep - investigate potential leaks');
    }

    if (memoryStats.peakMemoryMB > this.options.threshold * 0.8) {
      recommendations.push('Memory usage approaching threshold - consider optimization');
    }

    if (this.calculatePerformanceStats({ totalSamples: currentState.totalSamples }).samplesPerSecond < 1) {
      recommendations.push('Low sampling rate detected - consider reducing sampling interval');
    }

    if (recommendations.length === 0) {
      recommendations.push('No memory issues detected - system appears healthy');
    }

    return recommendations;
  }

  /**
   * Calculate appropriate exit code.
   */
  private calculateExitCode(
    detection: MemoryLeakDetection | null,
    memoryStats: MemorySweepResults['memoryStats']
  ): number {
    if (!this.options.exitCode) {
      return 0;
    }

    // Critical leak detected
    if (detection && detection.detected && detection.alertLevel === 'critical') {
      return 2;
    }

    // Warning level leak detected
    if (detection && detection.detected && detection.alertLevel === 'warning') {
      return 1;
    }

    // High memory growth
    if (memoryStats.memoryGrowthRate > 0.2) {
      return 1;
    }

    // Memory usage above threshold
    if (memoryStats.peakMemoryMB > this.options.threshold) {
      return 1;
    }

    return 0;
  }

  /**
   * Log results to console.
   */
  private logResults(results: MemorySweepResults): void {
    console.log('\n📋 Memory Sweep Results:');
    console.log(`   Duration: ${results.durationMs}ms`);
    console.log(`   Samples: ${results.totalSamples}`);
    console.log(`   Initial Memory: ${results.memoryStats.initialMemoryMB.toFixed(2)}MB`);
    console.log(`   Final Memory: ${results.memoryStats.finalMemoryMB.toFixed(2)}MB`);
    console.log(`   Peak Memory: ${results.memoryStats.peakMemoryMB.toFixed(2)}MB`);
    console.log(`   Memory Growth: ${results.memoryStats.memoryGrowthMB.toFixed(2)}MB (${(results.memoryStats.memoryGrowthRate * 100).toFixed(2)}%)`);
    console.log(`   Samples/sec: ${results.performance.samplesPerSecond.toFixed(2)}`);

    if (results.detection && results.detection.detected) {
      console.log(`\n⚠️  Memory Leak Detected:`);
      console.log(`   Alert Level: ${results.detection.alertLevel.toUpperCase()}`);
      console.log(`   Reason: ${results.detection.reason}`);
      console.log(`   Growth Rate: ${(results.detection.growthRate * 100).toFixed(2)}%`);
    } else {
      console.log(`\n✅ No memory leaks detected`);
    }

    console.log(`\n💡 Recommendations:`);
    results.recommendations.forEach(rec => {
      console.log(`   - ${rec}`);
    });

    if (this.options.exitCode) {
      console.log(`\n🚪 Exit Code: ${results.exitCode}`);
    }
  }

  /**
   * Export results to JSON format.
   */
  exportToJSON(results: MemorySweepResults): string {
    return JSON.stringify({
      sweep: results,
      exportMetadata: {
        exportedAt: Date.now(),
        exportedBy: 'memory-leak-sweep-cli',
        format: 'json',
        version: '1.0.0',
      },
    }, null, 2);
  }

  /**
   * Export results to Markdown format.
   */
  exportToMarkdown(results: MemorySweepResults): string {
    const lines = [
      `# Memory Leak Sweep Report`,
      '',
      `**Sweep Duration:** ${results.durationMs}ms`,
      `**Timestamp:** ${new Date(results.timestamp).toISOString()}`,
      `**Process ID:** ${results.processInfo.pid}`,
      `**Node Version:** ${results.processInfo.nodeVersion}`,
      `**Platform:** ${results.processInfo.platform} (${results.processInfo.arch})`,
      '',
      `## Configuration`,
      '',
      `- **Memory Threshold:** ${results.config.thresholdMB}MB`,
      `- **Sampling Interval:** ${results.config.samplingIntervalMs}ms`,
      `- **Growth Rate Threshold:** ${(results.config.growthRateThreshold * 100).toFixed(2)}%`,
      `- **Trend Duration:** ${results.config.trendDurationMs}ms`,
      '',
      `## Memory Statistics`,
      '',
      `- **Initial Memory:** ${results.memoryStats.initialMemoryMB.toFixed(2)}MB`,
      `- **Final Memory:** ${results.memoryStats.finalMemoryMB.toFixed(2)}MB`,
      `- **Peak Memory:** ${results.memoryStats.peakMemoryMB.toFixed(2)}MB`,
      `- **Average Memory:** ${results.memoryStats.averageMemoryMB.toFixed(2)}MB`,
      `- **Memory Growth:** ${results.memoryStats.memoryGrowthMB.toFixed(2)}MB (${(results.memoryStats.memoryGrowthRate * 100).toFixed(2)}%)`,
      '',
      `## Performance Metrics`,
      '',
      `- **Total Samples:** ${results.totalSamples}`,
      `- **Sweep Duration:** ${results.performance.sweepDurationMs}ms`,
      `- **Average Sample Interval:** ${results.performance.averageSampleIntervalMs.toFixed(2)}ms`,
      `- **Samples per Second:** ${results.performance.samplesPerSecond.toFixed(2)}`,
      '',
    ];

    if (results.detection && results.detection.detected) {
      lines.push(
        `## Memory Leak Detection`,
        '',
        `**Status:** ⚠️ DETECTED`,
        `**Alert Level:** ${results.detection.alertLevel.toUpperCase()}`,
        `**Reason:** ${results.detection.reason}`,
        `**Growth Rate:** ${(results.detection.growthRate * 100).toFixed(2)}%`,
        `**Trend Direction:** ${results.detection.trend.direction}`,
        `**Sample Count:** ${results.detection.trend.sampleCount}`,
        `**Slope:** ${results.detection.trend.slope.toFixed(4)}MB/sec`,
        `**R²:** ${results.detection.trend.rSquared.toFixed(4)}`,
        ''
      );
    } else {
      lines.push(
        `## Memory Leak Detection`,
        '',
        `**Status:** ✅ NO LEAKS DETECTED`,
        ''
      );
    }

    lines.push(
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
      `*Generated by Memory Leak Sweep CLI v1.0.0*`
    );

    return lines.join('\n');
  }
}

// CLI Setup
const program = new Command();

program
  .name('memory-leak-sweep')
  .description('CLI tool for memory leak detection and analysis')
  .version('1.0.0');

program
  .requiredOption('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json|markdown)', 'markdown')
  .option('-d, --duration <ms>', 'Sweep duration in milliseconds', (value) => parseInt(value), 60000)
  .option('-t, --threshold <mb>', 'Memory threshold in MB', (value) => parseInt(value), 100)
  .option('-i, --interval <ms>', 'Sampling interval in milliseconds', (value) => parseInt(value), 5000)
  .option('-g, --growth-rate <rate>', 'Growth rate threshold (0.0-1.0)', (value) => parseFloat(value), 0.5)
  .option('-v, --verbose', 'Enable verbose output')
  .option('--dry-run', 'Show what would be exported without writing files')
  .option('--exit-code', 'Set exit code based on detection results')
  .option('-c, --config <path>', 'Configuration file path')
  .action(async (options) => {
    try {
      const runner = new MemorySweepRunner(options);
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
      console.error('❌ Memory sweep failed:', error);
      process.exit(1);
    }
  });

// Run CLI
if (require.main === module) {
  program.parse();
}

export { MemorySweepRunner };
