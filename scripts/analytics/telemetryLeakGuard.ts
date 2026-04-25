#!/usr/bin/env node

/**
 * NP-050 – Telemetry Memory Leak Guard CLI
 * 
 * CLI tool for monitoring memory footprint of telemetry pipelines,
 * detecting leaks, and generating reports with configurable thresholds.
 * 
 * @since 2026-01-21
 * @author Sentinel-Analytics – Leak Guard
 */

import { Command } from 'commander';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { TelemetryLeakGuard, type MemoryLeakDetection, type MemorySample } from '@/analytics/memory/TelemetryLeakGuard';
import { 
  createMemoryLeakGuardConfig, 
  createEnvironmentSpecificConfig,
  validateMemoryLeakGuardConfig,
  type MemoryLeakGuardConfig 
} from '@/analytics/memory/memoryLeakGuardConfig';

// === CLI Configuration ===

const program = new Command();

program
  .name('telemetryLeakGuard')
  .description('CLI tool for monitoring memory leaks in telemetry pipelines')
  .version('1.0.0');

// === Command Options ===

program
  .option('-c, --config <path>', 'Configuration file path')
  .option('-e, --environment <env>', 'Environment (development|staging|production)', 'development')
  .option('-d, --duration <minutes>', 'Monitoring duration in minutes', '60')
  .option('-i, --interval <seconds>', 'Sampling interval in seconds', '5')
  .option('-o, --output <path>', 'Output file path for reports')
  .option('--output-dir <dir>', 'Output directory for reports', 'test-results')
  .option('--format <format>', 'Report format (json|markdown|csv)', 'json')
  .option('--max-heap <mb>', 'Maximum heap size threshold (MB)', '100')
  .option('--growth-rate <rate>', 'Growth rate threshold (MB/min)', '5.0')
  .option('--leak-slope <slope>', 'Leak slope threshold (MB/min)', '2.0')
  .option('--sample-window <minutes>', 'Sample window for analysis (minutes)', '10')
  .option('--alert-threshold <severity>', 'Minimum alert severity (low|medium|high|critical)', 'medium')
  .option('--no-telemetry', 'Disable telemetry events')
  .option('--no-persistence', 'Disable persistence of samples')
  .option('--verbose', 'Enable verbose logging')
  .option('--dry-run', 'Analyze existing data without starting guard');

// === Main Command Implementation ===

program.action(async (options) => {
  const startTime = Date.now();
  
  try {
    console.log('🛡️ Starting Telemetry Memory Leak Guard CLI...');
    console.log(`📊 Environment: ${options.environment}`);
    console.log(`⏱️ Duration: ${options.duration} minutes`);
    console.log(`🔄 Sampling interval: ${options.interval} seconds`);
    
    // Load or create configuration
    const config = await loadConfiguration(options);
    console.log(`⚙️ Configuration loaded for instance: ${config.instanceId}`);
    
    if (options.verbose) {
      console.log('📋 Configuration:', JSON.stringify(config, null, 2));
    }
    
    // Create guard instance
    const guard = new TelemetryLeakGuard(config);
    
    if (options.dryRun) {
      await runDryRun(guard, options);
    } else {
      await runMonitoring(guard, options, startTime);
    }
    
    console.log('✅ Memory leak guard CLI completed successfully!');
    
  } catch (error) {
    console.error('❌ Memory leak guard CLI failed:', error);
    process.exit(1);
  }
});

// === Helper Functions ===

/**
 * Loads configuration from file or creates default.
 */
async function loadConfiguration(options: any): Promise<MemoryLeakGuardConfig> {
  let config: MemoryLeakGuardConfig;
  
  if (options.config) {
    try {
      const fs = await import('fs/promises');
      const configData = JSON.parse(await fs.readFile(options.config, 'utf-8'));
      config = validateMemoryLeakGuardConfig(configData);
      console.log(`📁 Loaded configuration from: ${options.config}`);
    } catch (error) {
      console.error(`❌ Failed to load configuration from ${options.config}:`, error);
      throw error;
    }
  } else {
    // Create environment-specific configuration
    config = createEnvironmentSpecificConfig(options.environment as any);
    console.log(`🔧 Created ${options.environment} configuration`);
  }
  
  // Apply CLI overrides
  const overrides: Partial<MemoryLeakGuardConfig> = {
    thresholds: {
      ...config.thresholds,
      maxHeapSizeMB: parseFloat(options.maxHeap),
      growthRateMBPerMin: parseFloat(options.growthRate),
      leakSlopeThreshold: parseFloat(options.leakSlope),
      sampleWindowMin: parseInt(options.sampleWindow),
    },
    sampling: {
      ...config.sampling,
      intervalMs: parseInt(options.interval) * 1000,
    },
    telemetry: {
      ...config.telemetry,
      enabled: !options.noTelemetry,
    },
    persistence: {
      ...config.persistence,
      enabled: !options.noPersistence,
    },
  };
  
  // Filter alert channels by severity threshold
  const severityLevels = ['low', 'medium', 'high', 'critical'];
  const minSeverityIndex = severityLevels.indexOf(options.alertThreshold);
  overrides.alertChannels = config.alertChannels.filter(channel => 
    channel.severity.some(severity => 
      severityLevels.indexOf(severity) >= minSeverityIndex
    )
  );
  
  return { ...config, ...overrides };
}

/**
 * Runs dry-run analysis on existing data.
 */
async function runDryRun(guard: TelemetryLeakGuard, options: any): Promise<void> {
  console.log('🔍 Running dry-run analysis...');
  
  // Collect a sample to check existing data
  await guard.collectSample('cli-dry-run');
  
  const stats = guard.getMemoryStats();
  console.log(`📈 Found ${stats.sampleCount} existing samples`);
  
  if (stats.sampleCount < 5) {
    console.log('⚠️ Insufficient data for analysis. Consider running with longer duration first.');
    return;
  }
  
  // Analyze memory
  const detection = await guard.analyzeMemory();
  
  // Generate report
  await generateReport(detection, stats, options);
  
  console.log(`📊 Analysis complete: ${detection.leakDetected ? 'LEAK DETECTED' : 'No leaks detected'}`);
  if (detection.leakDetected) {
    console.log(`🚨 Severity: ${detection.severity.toUpperCase()}`);
    console.log(`📝 Reasons: ${detection.reasons.join('; ')}`);
  }
}

/**
 * Runs full monitoring session.
 */
async function runMonitoring(guard: TelemetryLeakGuard, options: any, startTime: number): Promise<void> {
  console.log('🚀 Starting memory monitoring session...');
  
  // Start the guard
  await guard.start();
  
  // Monitor for specified duration
  const durationMs = parseInt(options.duration) * 60 * 1000;
  const endTime = startTime + durationMs;
  
  console.log(`⏰ Monitoring for ${options.duration} minutes...`);
  
  // Periodic status updates
  const statusInterval = setInterval(() => {
    const stats = guard.getMemoryStats();
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const remaining = ((endTime - Date.now()) / 1000 / 60).toFixed(1);
    
    console.log(`📊 Status (${elapsed}/${options.duration}min): ${stats.sampleCount} samples, ${stats.current?.heapUsedMB.toFixed(1) || 'N/A'}MB heap`);
    
    if (options.verbose && stats.trend) {
      console.log(`📈 Trend: ${stats.trend.growthSlopeMBPerMin.toFixed(2)}MB/min, confidence: ${(stats.trend.confidence * 100).toFixed(1)}%`);
    }
  }, 30000); // Every 30 seconds
  
  // Wait for completion
  await new Promise(resolve => setTimeout(resolve, durationMs));
  
  clearInterval(statusInterval);
  
  // Final analysis
  console.log('🔍 Running final analysis...');
  const detection = await guard.analyzeMemory();
  const stats = guard.getMemoryStats();
  
  // Stop the guard
  await guard.stop();
  
  // Generate report
  await generateReport(detection, stats, options);
  
  // Summary
  const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`📋 Session Summary:`);
  console.log(`   Duration: ${totalDuration} minutes`);
  console.log(`   Samples collected: ${stats.sampleCount}`);
  console.log(`   Final heap usage: ${stats.current?.heapUsedMB.toFixed(1)}MB`);
  console.log(`   Leak detected: ${detection.leakDetected ? 'YES' : 'NO'}`);
  
  if (detection.leakDetected) {
    console.log(`   Severity: ${detection.severity.toUpperCase()}`);
    console.log(`   Alert channels: ${detection.triggeredChannels.join(', ')}`);
    process.exit(1); // Exit with error code if leak detected
  }
}

/**
 * Generates and saves analysis report.
 */
async function generateReport(detection: MemoryLeakDetection, stats: any, options: any): Promise<void> {
  const reportData = {
    timestamp: new Date().toISOString(),
    cliOptions: options,
    detection,
    stats: {
      sampleCount: stats.sampleCount,
      currentUsage: stats.current,
      trend: stats.trend,
      isRunning: stats.isRunning,
    },
    summary: {
      leakDetected: detection.leakDetected,
      severity: detection.severity,
      currentHeapMB: detection.currentUsage.heapUsedMB,
      growthRateMBPerMin: detection.trend.growthSlopeMBPerMin,
      confidence: detection.trend.confidence,
      recommendations: detection.recommendations,
    },
  };
  
  // Ensure output directory exists
  await mkdir(options.outputDir, { recursive: true });
  
  // Generate report in requested format
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = `telemetry-memory-leak-report-${timestamp}`;
  
  switch (options.format) {
    case 'json':
      await generateJSONReport(reportData, options.outputDir, baseFilename, options.output);
      break;
    case 'markdown':
      await generateMarkdownReport(reportData, options.outputDir, baseFilename, options.output);
      break;
    case 'csv':
      await generateCSVReport(reportData, options.outputDir, baseFilename, options.output);
      break;
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
  
  console.log(`📄 Report generated: ${options.format.toUpperCase()} format`);
}

/**
 * Generates JSON report.
 */
async function generateJSONReport(data: any, outputDir: string, baseFilename: string, customPath?: string): Promise<void> {
  const filePath = customPath || join(outputDir, `${baseFilename}.json`);
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`💾 JSON report saved: ${filePath}`);
}

/**
 * Generates Markdown report.
 */
async function generateMarkdownReport(data: any, outputDir: string, baseFilename: string, customPath?: string): Promise<void> {
  const filePath = customPath || join(outputDir, `${baseFilename}.md`);
  
  const markdown = generateMarkdownContent(data);
  await writeFile(filePath, markdown, 'utf-8');
  console.log(`💾 Markdown report saved: ${filePath}`);
}

/**
 * Generates CSV report.
 */
async function generateCSVReport(data: any, outputDir: string, baseFilename: string, customPath?: string): Promise<void> {
  const filePath = customPath || join(outputDir, `${baseFilename}.csv`);
  
  // Generate CSV content (simplified - would include samples if available)
  const csv = generateCSVContent(data);
  await writeFile(filePath, csv, 'utf-8');
  console.log(`💾 CSV report saved: ${filePath}`);
}

/**
 * Generates Markdown content for report.
 */
function generateMarkdownContent(data: any): string {
  const { detection, stats, summary } = data;
  
  return `# Telemetry Memory Leak Guard Report

**Generated:** ${data.timestamp}  
**Environment:** ${data.cliOptions.environment}  
**Duration:** ${data.cliOptions.duration} minutes  
**Samples:** ${stats.sampleCount}

## Executive Summary

- **Leak Detected:** ${summary.leakDetected ? '🚨 YES' : '✅ NO'}
- **Severity:** ${summary.severity.toUpperCase()}
- **Current Heap:** ${summary.currentHeapMB.toFixed(1)} MB
- **Growth Rate:** ${summary.growthRateMBPerMin.toFixed(2)} MB/min
- **Confidence:** ${(summary.confidence * 100).toFixed(1)}%

## Current Memory Usage

| Metric | Value |
|--------|-------|
| Heap Used | ${detection.currentUsage.heapUsedMB.toFixed(1)} MB |
| Heap Total | ${detection.currentUsage.heapTotalMB.toFixed(1)} MB |
| External | ${detection.currentUsage.externalMB.toFixed(1)} MB |
| RSS | ${detection.currentUsage.rssMB.toFixed(1)} MB |
| CPU Usage | ${detection.currentUsage.cpuUsage.toFixed(1)}% |

## Trend Analysis

| Metric | Value |
|--------|-------|
| Sample Window | ${detection.trend.windowMin.toFixed(1)} minutes |
| Sample Count | ${detection.trend.sampleCount} |
| Growth Slope | ${detection.trend.growthSlopeMBPerMin.toFixed(2)} MB/min |
| Correlation | ${detection.trend.correlation.toFixed(3)} |
| Predicted Next Hour | ${detection.trend.predictedNextHourMB.toFixed(1)} MB |
| Time to Threshold | ${detection.trend.timeToThresholdMin ? `${detection.trend.timeToThresholdMin.toFixed(1)} minutes` : 'N/A'} |

## Detection Details

${detection.leakDetected ? `
### 🚨 Memory Leak Detected

**Severity:** ${detection.severity.toUpperCase()}

**Detection Reasons:**
${detection.reasons.map(reason => `- ${reason}`).join('\n')}

**Recommendations:**
${detection.recommendations.map(rec => `- ${rec}`).join('\n')}

**Alert Channels Triggered:**
${detection.triggeredChannels.map(channel => `- ${channel}`).join('\n')}
` : `
### ✅ No Memory Leak Detected

Memory usage is within normal parameters and no leak patterns were detected.
`}

## Configuration

| Setting | Value |
|----------|-------|
| Max Heap Size | ${data.cliOptions.maxHeap} MB |
| Growth Rate Threshold | ${data.cliOptions.growthRate} MB/min |
| Leak Slope Threshold | ${data.cliOptions.leakSlope} MB/min |
| Sample Window | ${data.cliOptions.sampleWindow} minutes |
| Sampling Interval | ${data.cliOptions.interval} seconds |
| Alert Threshold | ${data.cliOptions.alertThreshold} |

---

*Report generated by Telemetry Memory Leak Guard CLI v1.0.0*
`;
}

/**
 * Generates CSV content for report.
 */
function generateCSVContent(data: any): string {
  const { detection, stats } = data;
  
  const headers = [
    'timestamp',
    'leak_detected',
    'severity',
    'heap_used_mb',
    'heap_total_mb',
    'external_mb',
    'rss_mb',
    'cpu_usage',
    'growth_slope_mb_per_min',
    'correlation',
    'predicted_next_hour_mb',
    'time_to_threshold_min',
    'sample_count',
    'confidence'
  ];
  
  const row = [
    new Date(detection.timestamp).toISOString(),
    detection.leakDetected,
    detection.severity,
    detection.currentUsage.heapUsedMB.toFixed(2),
    detection.currentUsage.heapTotalMB.toFixed(2),
    detection.currentUsage.externalMB.toFixed(2),
    detection.currentUsage.rssMB.toFixed(2),
    detection.currentUsage.cpuUsage.toFixed(2),
    detection.trend.growthSlopeMBPerMin.toFixed(4),
    detection.trend.correlation.toFixed(4),
    detection.trend.predictedNextHourMB.toFixed(2),
    detection.trend.timeToThresholdMin || '',
    stats.sampleCount,
    detection.trend.confidence.toFixed(4)
  ];
  
  return [headers.join(','), row.join(',')].join('\n');
}

// === CLI Execution ===

if (require.main === module) {
  program.parse();
}

export { program as telemetryLeakGuardCLI };
