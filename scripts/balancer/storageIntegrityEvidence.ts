#!/usr/bin/env node

/**
 * NP-098 – Balancer Storage Integrity Evidence CLI
 * 
 * Collects storage testing framework evidence, creates signed bundles,
 * and generates comprehensive evidence logs according to KS-005 standards.
 */

import { parseArgs } from 'node:util';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';

// Type imports
import type { 
  StorageEvidenceConfig, 
  StorageEvidenceTarget, 
  StorageEvidencePreset 
} from '../../src/analytics/balancer/storageEvidenceConfig.js';
import { 
  DEFAULT_STORAGE_EVIDENCE_CONFIG, 
  STORAGE_EVIDENCE_PRESETS 
} from '../../src/analytics/balancer/storageEvidenceConfig.js';
import { StorageTestFramework } from '../../src/shared/testing/StorageTestFramework.js';

/**
 * CLI options interface
 */
interface CLIOptions {
  preset?: string;
  output?: string;
  verbose?: boolean;
  dryRun?: boolean;
  help?: boolean;
  targets?: string[];
  format?: string[];
  retries?: number;
  timeout?: number;
}

/**
 * Storage test result interface
 */
interface StorageTestResult {
  targetId: string;
  targetName: string;
  success: boolean;
  duration: number;
  error?: string;
  metrics: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
    averageTime: number;
    memoryUsage: number;
  };
  details: any;
}

/**
 * Evidence bundle interface
 */
interface EvidenceBundle {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  duration: number;
  config: StorageEvidenceConfig;
  results: StorageTestResult[];
  summary: {
    totalTargets: number;
    successfulTargets: number;
    failedTargets: number;
    overallSuccessRate: number;
    totalDuration: number;
    checksum: string;
  };
  telemetry: {
    eventId: string;
    timestamp: string;
    metadata: Record<string, any>;
  };
}

/**
 * Parse command line arguments
 */
async function parseCLIOptions(): Promise<CLIOptions> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      preset: {
        type: 'string',
        description: 'Configuration preset to use (quick, comprehensive, performance)',
      },
      output: {
        type: 'string',
        description: 'Output directory for evidence files',
      },
      verbose: {
        type: 'boolean',
        description: 'Enable verbose logging',
      },
      dryRun: {
        type: 'boolean',
        description: 'Show what would be done without executing',
      },
      help: {
        type: 'boolean',
        description: 'Show help information',
      },
      targets: {
        type: 'string',
        description: 'Comma-separated list of target IDs to test',
      },
      format: {
        type: 'string',
        description: 'Output formats (json,markdown,csv)',
      },
      retries: {
        type: 'string',
        description: 'Number of retry attempts',
      },
      timeout: {
        type: 'string',
        description: 'Total timeout in milliseconds',
      },
    },
    allowPositionals: false,
  });

  const options: CLIOptions = {
    preset: values.preset,
    output: values.output,
    verbose: values.verbose || false,
    dryRun: values.dryRun || false,
    help: values.help || false,
    targets: values.targets ? values.targets.split(',').map(t => t.trim()) : undefined,
    format: values.format ? values.format.split(',').map(f => f.trim()) : undefined,
    retries: values.retries ? parseInt(values.retries, 10) : undefined,
    timeout: values.timeout ? parseInt(values.timeout, 10) : undefined,
  };

  return options;
}

/**
 * Load configuration based on options
 */
async function loadConfiguration(options: CLIOptions): Promise<StorageEvidenceConfig> {
  let config: StorageEvidenceConfig;

  if (options.preset) {
    const presetKey = options.preset as StorageEvidencePreset;
    if (!(presetKey in STORAGE_EVIDENCE_PRESETS)) {
      throw new Error(`Unknown preset: ${options.preset}. Available: ${Object.keys(STORAGE_EVIDENCE_PRESETS).join(', ')}`);
    }
    config = { ...STORAGE_EVIDENCE_PRESETS[presetKey] };
  } else {
    config = { ...DEFAULT_STORAGE_EVIDENCE_CONFIG };
  }

  // Apply CLI overrides
  if (options.output) {
    config.output.outputDir = options.output;
  }
  if (options.verbose) {
    config.execution.verbose = true;
  }
  if (options.retries !== undefined) {
    config.execution.maxRetries = options.retries;
  }
  if (options.timeout !== undefined) {
    config.execution.totalTimeout = options.timeout;
  }
  if (options.format) {
    config.output.formats = options.format as any[];
  }

  // Filter targets if specified
  if (options.targets) {
    config.targets = config.targets.filter(target => 
      options.targets!.includes(target.id)
    );
  }

  return config;
}

/**
 * Setup storage adapters for targets
 */
function setupStorageAdapters(config: StorageEvidenceConfig): void {
  // This would integrate with actual storage adapters
  // For now, we'll use localStorage adapters
  config.targets.forEach(target => {
    if (!target.adapter) {
      // Create a simple localStorage adapter
      target.adapter = {
        async get(key: string) {
          try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
          } catch {
            return null;
          }
        },
        async set(key: string, value: any) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
          } catch {
            return false;
          }
        },
        async clear(key: string) {
          try {
            localStorage.removeItem(key);
            return true;
          } catch {
            return false;
          }
        },
      };
    }
  });
}

/**
 * Execute storage tests for a target
 */
async function executeStorageTest(
  target: StorageEvidenceTarget,
  config: StorageEvidenceConfig
): Promise<StorageTestResult> {
  const startTime = performance.now();
  const targetId = target.id;
  const targetName = target.name;

  try {
    if (config.execution.verbose) {
      console.log(`🔍 Testing target: ${targetName} (${targetId})`);
    }

    // Create Storage Test Framework instance
    const framework = new StorageTestFramework(
      targetId,
      target.adapter,
      {
        timeout: config.thresholds.maxExecutionTime,
        maxRetries: config.execution.maxRetries,
        verbose: config.execution.verbose,
      }
    );

    // Execute the full test suite
    const testResults = await framework.runFullTest(
      target.testData,
      target.alternateData
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Calculate metrics
    const totalTests = testResults.results.length;
    const passedTests = testResults.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? passedTests / totalTests : 0;
    const averageTime = totalTests > 0 
      ? testResults.results.reduce((sum, r) => sum + r.duration, 0) / totalTests 
      : 0;

    // Estimate memory usage (simplified)
    const memoryUsage = Math.round(JSON.stringify(testResults).length / 1024);

    const result: StorageTestResult = {
      targetId,
      targetName,
      success: successRate >= config.thresholds.minSuccessRate,
      duration,
      metrics: {
        totalTests,
        passedTests,
        failedTests,
        successRate,
        averageTime,
        memoryUsage,
      },
      details: testResults,
    };

    if (config.execution.verbose) {
      console.log(`✅ ${targetName}: ${passedTests}/${totalTests} tests passed (${(successRate * 100).toFixed(1)}%)`);
    }

    return result;

  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const result: StorageTestResult = {
      targetId,
      targetName,
      success: false,
      duration,
      error: error instanceof Error ? error.message : String(error),
      metrics: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        successRate: 0,
        averageTime: 0,
        memoryUsage: 0,
      },
      details: null,
    };

    if (config.execution.verbose) {
      console.log(`❌ ${targetName}: Failed - ${result.error}`);
    }

    return result;
  }
}

/**
 * Generate checksum for evidence bundle
 */
function generateChecksum(bundle: EvidenceBundle): string {
  const bundleString = JSON.stringify(bundle, null, 2);
  return createHash('sha256').update(bundleString).digest('hex');
}

/**
 * Export evidence bundle to different formats
 */
function exportBundle(bundle: EvidenceBundle, config: StorageEvidenceConfig): Record<string, string> {
  const exports: Record<string, string> = {};

  // JSON export
  if (config.output.formats.includes('json')) {
    exports.json = JSON.stringify(bundle, null, 2);
  }

  // Markdown export
  if (config.output.formats.includes('markdown')) {
    exports.markdown = generateMarkdownReport(bundle);
  }

  // CSV export
  if (config.output.formats.includes('csv')) {
    exports.csv = generateCSVReport(bundle);
  }

  return exports;
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(bundle: EvidenceBundle): string {
  const { summary, results, telemetry } = bundle;
  
  let markdown = `# ${bundle.name}\n\n`;
  markdown += `**Description**: ${bundle.description}\n\n`;
  markdown += `**Timestamp**: ${bundle.timestamp}\n`;
  markdown += `**Duration**: ${bundle.duration}ms\n`;
  markdown += `**Evidence ID**: ${bundle.id}\n`;
  markdown += `**Checksum**: \`${summary.checksum}\`\n\n`;

  markdown += `## Summary\n\n`;
  markdown += `- **Total Targets**: ${summary.totalTargets}\n`;
  markdown += `- **Successful**: ${summary.successfulTargets}\n`;
  markdown += `- **Failed**: ${summary.failedTargets}\n`;
  markdown += `- **Success Rate**: ${(summary.overallSuccessRate * 100).toFixed(1)}%\n`;
  markdown += `- **Total Duration**: ${summary.totalDuration}ms\n\n`;

  markdown += `## Results\n\n`;
  markdown += `| Target | Status | Tests | Pass Rate | Duration | Memory |\n`;
  markdown += `|--------|--------|-------|-----------|----------|--------|\n`;

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const passRate = (result.metrics.successRate * 100).toFixed(1);
    markdown += `| ${result.targetName} | ${status} | ${result.metrics.totalTests} | ${passRate}% | ${result.duration.toFixed(1)}ms | ${result.metrics.memoryUsage}KB |\n`;
  });

  markdown += `\n## Telemetry\n\n`;
  markdown += `**Event ID**: ${telemetry.eventId}\n`;
  markdown += `**Timestamp**: ${telemetry.timestamp}\n\n`;

  if (bundle.config.output.includeDetailedResults) {
    markdown += `## Detailed Results\n\n`;
    results.forEach(result => {
      markdown += `### ${result.targetName}\n\n`;
      if (result.error) {
        markdown += `**Error**: ${result.error}\n\n`;
      }
      markdown += `**Metrics**:\n`;
      markdown += `- Total Tests: ${result.metrics.totalTests}\n`;
      markdown += `- Passed: ${result.metrics.passedTests}\n`;
      markdown += `- Failed: ${result.metrics.failedTests}\n`;
      markdown += `- Success Rate: ${(result.metrics.successRate * 100).toFixed(1)}%\n`;
      markdown += `- Average Time: ${result.metrics.averageTime.toFixed(1)}ms\n`;
      markdown += `- Memory Usage: ${result.metrics.memoryUsage}KB\n\n`;
    });
  }

  return markdown;
}

/**
 * Generate CSV report
 */
function generateCSVReport(bundle: EvidenceBundle): string {
  const { results } = bundle;
  
  let csv = 'Target ID,Target Name,Status,Total Tests,Passed Tests,Failed Tests,Success Rate,Duration (ms),Memory Usage (KB)\n';
  
  results.forEach(result => {
    const status = result.success ? 'PASS' : 'FAIL';
    const passRate = (result.metrics.successRate * 100).toFixed(2);
    csv += `${result.targetId},"${result.targetName}",${status},${result.metrics.totalTests},${result.metrics.passedTests},${result.metrics.failedTests},${passRate},${result.duration.toFixed(1)},${result.metrics.memoryUsage}\n`;
  });

  return csv;
}

/**
 * Emit telemetry event
 */
function emitTelemetry(bundle: EvidenceBundle): void {
  console.log('📊 Telemetry emitted: balancer_storage_evidence_generated');
  console.log(`Event ID: ${bundle.telemetry.eventId}`);
  console.log(`Timestamp: ${bundle.telemetry.timestamp}`);
  console.log(`Bundle ID: ${bundle.id}`);
  console.log(`Targets: ${bundle.summary.totalTargets}`);
  console.log(`Success Rate: ${(bundle.summary.overallSuccessRate * 100).toFixed(1)}%`);
}

/**
 * Create evidence log
 */
function createEvidenceLog(bundle: EvidenceBundle, exitCode: number): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const logPath = join(bundle.config.output.outputDir, `np-098-storage-integrity-evidence-${timestamp}.log`);
  
  let logContent = `# NP-098 – Balancer Storage Integrity Evidence CLI\n\n`;
  logContent += `## Evidence Log – ${new Date().toISOString()}\n\n`;
  logContent += `### Status: ${exitCode === 0 ? 'COMPLETATO' : 'BLOCCATO'}\n\n`;
  logContent += `### Bundle Information\n`;
  logContent += `- **Bundle ID**: ${bundle.id}\n`;
  logContent += `- **Name**: ${bundle.name}\n`;
  logContent += `- **Checksum**: ${bundle.summary.checksum}\n`;
  logContent += `- **Timestamp**: ${bundle.timestamp}\n`;
  logContent += `- **Duration**: ${bundle.duration}ms\n\n`;
  
  logContent += `### Results Summary\n`;
  logContent += `- **Total Targets**: ${bundle.summary.totalTargets}\n`;
  logContent += `- **Successful**: ${bundle.summary.successfulTargets}\n`;
  logContent += `- **Failed**: ${bundle.summary.failedTargets}\n`;
  logContent += `- **Success Rate**: ${(bundle.summary.overallSuccessRate * 100).toFixed(1)}%\n\n`;
  
  logContent += `### Exit Code: ${exitCode}\n\n`;
  
  logContent += `### Files Generated\n`;
  bundle.config.output.formats.forEach(format => {
    const filename = `${bundle.id}.${format}`;
    logContent += `- ${filename}\n`;
  });
  
  logContent += `\n### Telemetry Event\n`;
  logContent += `- **Event**: balancer_storage_evidence_generated\n`;
  logContent += `- **Event ID**: ${bundle.telemetry.eventId}\n`;
  logContent += `- **Timestamp**: ${bundle.telemetry.timestamp}\n`;

  // Ensure output directory exists
  mkdirSync(dirname(logPath), { recursive: true });
  writeFileSync(logPath, logContent, 'utf8');
  
  console.log(`📝 Evidence log saved to: ${logPath}`);
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const startTime = performance.now();

  try {
    console.log('🚀 NP-098 – Balancer Storage Integrity Evidence CLI');

    // Parse CLI options
    const options = await parseCLIOptions();
    
    if (options.help) {
      showHelp();
      return;
    }

    // Load configuration
    const config = await loadConfiguration(options);
    
    console.log(`📋 Configuration: ${config.name}`);
    if (options.verbose) {
      console.log(`📊 Targets: ${config.targets.length}`);
      console.log(`🔧 Formats: ${config.output.formats.join(', ')}`);
    }

    if (options.dryRun) {
      console.log('🔍 DRY RUN - No tests will be executed');
      console.log(`📁 Output directory: ${config.output.outputDir}`);
      console.log(`🎯 Targets: ${config.targets.map(t => t.id).join(', ')}`);
      return;
    }

    // Setup storage adapters
    setupStorageAdapters(config);

    // Execute tests
    console.log('🔍 Starting storage integrity tests...');
    const results: StorageTestResult[] = [];

    if (config.execution.parallelExecution) {
      // Parallel execution
      const promises = config.targets.map(target => 
        executeStorageTest(target, config)
      );
      const testResults = await Promise.all(promises);
      results.push(...testResults);
    } else {
      // Sequential execution
      for (const target of config.targets) {
        const result = await executeStorageTest(target, config);
        results.push(result);
        
        if (!result.success && !config.execution.continueOnFailure) {
          console.log(`⚠️ Stopping execution due to failure in ${target.targetName}`);
          break;
        }
      }
    }

    // Calculate summary
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    const successfulTargets = results.filter(r => r.success).length;
    const overallSuccessRate = results.length > 0 ? successfulTargets / results.length : 0;

    // Create evidence bundle
    const bundle: EvidenceBundle = {
      id: `storage-evidence-${Date.now()}`,
      name: config.name,
      description: config.description,
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      config,
      results,
      summary: {
        totalTargets: results.length,
        successfulTargets,
        failedTargets: results.length - successfulTargets,
        overallSuccessRate,
        totalDuration,
        checksum: '', // Will be set below
      },
      telemetry: {
        eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        metadata: {
          version: config.version,
          nodeVersion: process.version,
          platform: process.platform,
        },
      },
    };

    // Generate checksum
    bundle.summary.checksum = generateChecksum(bundle);

    // Export bundle
    const exports = exportBundle(bundle, config);
    
    // Write output files
    mkdirSync(config.output.outputDir, { recursive: true });
    
    config.output.formats.forEach(format => {
      const filename = config.output.createTimestampedFilenames 
        ? `${bundle.id}.${format}`
        : `storage-evidence.${format}`;
      const filepath = join(config.output.outputDir, filename);
      writeFileSync(filepath, exports[format], 'utf8');
      console.log(`📁 ${format.toUpperCase()} export: ${filepath}`);
    });

    // Emit telemetry
    emitTelemetry(bundle);

    // Determine exit code
    const exitCode = overallSuccessRate >= config.thresholds.minSuccessRate ? 0 : 1;

    // Create evidence log
    createEvidenceLog(bundle, exitCode);

    // Display results
    console.log('\n📊 Evidence Bundle Summary:');
    console.log(`✅ Successful: ${successfulTargets}/${results.length} targets`);
    console.log(`📈 Success Rate: ${(overallSuccessRate * 100).toFixed(1)}%`);
    console.log(`⏱️ Duration: ${totalDuration.toFixed(1)}ms`);
    console.log(`🔐 Checksum: ${bundle.summary.checksum.substring(0, 16)}...`);

    if (exitCode > 0) {
      console.log('\n❌ EVIDENCE COLLECTION FAILED');
      console.log('Review the detailed reports for failed validations.');
    } else {
      console.log('\n✅ EVIDENCE COLLECTION COMPLETED');
    }

    // Exit with appropriate code
    process.exit(exitCode);

  } catch (error) {
    console.error('❌ CLI Error:', error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}

/**
 * Show help information
 */
function showHelp(): void {
  console.log(`
NP-098 – Balancer Storage Integrity Evidence CLI

USAGE:
  node storageIntegrityEvidence.ts [OPTIONS]

OPTIONS:
  --preset <name>        Configuration preset (quick, comprehensive, performance)
  --output <dir>         Output directory for evidence files
  --targets <list>       Comma-separated list of target IDs
  --format <list>        Output formats (json,markdown,csv)
  --retries <number>     Number of retry attempts
  --timeout <ms>         Total timeout in milliseconds
  --verbose              Enable verbose logging
  --dry-run              Show what would be done without executing
  --help                 Show this help information

EXAMPLES:
  node storageIntegrityEvidence.ts --preset quick
  node storageIntegrityEvidence.ts --preset comprehensive --verbose
  node storageIntegrityEvidence.ts --targets balancer-config,spell-storage --format json,markdown
  node storageIntegrityEvidence.ts --dry-run --verbose

PRESETS:
  quick          Fast validation for CI/CD (1 target, basic thresholds)
  comprehensive  Full validation suite (all targets, strict thresholds)
  performance    Performance-focused testing (strict timing, memory limits)
`);
}

// Execute CLI
const importPath = decodeURIComponent(import.meta.url).replace('file://', '');
const processPath = process.argv[1];

if (importPath === processPath) {
  main().catch(console.error);
}
