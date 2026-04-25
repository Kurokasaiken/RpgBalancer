#!/usr/bin/env node

/**
 * NP-103 – Idle Village Drag Diagnostics CLI
 * 
 * Reproduces Phase E drag/drop scenarios, measures latency/validation,
 * and generates comprehensive diagnostic reports.
 */

import { parseArgs } from 'node:util';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';

// Type imports
import type { 
  DragDiagnosticsConfig, 
  DragScenario, 
  DragDiagnosticsPreset 
} from '../../src/ui/idleVillage/diagnostics/dragDiagnosticsConfig.js';
import { 
  DEFAULT_DRAG_DIAGNOSTICS_CONFIG, 
  DRAG_DIAGNOSTICS_PRESETS 
} from '../../src/ui/idleVillage/diagnostics/dragDiagnosticsConfig.js';
import { validateResidentDrop } from '../../src/ui/idleVillage/utils/locationDropValidators.js';
import type { IdleVillageConfig } from '../../src/balancing/config/idleVillage/types.js';

/**
 * CLI options interface
 */
interface CLIOptions {
  preset?: string;
  output?: string;
  verbose?: boolean;
  'dry-run'?: boolean;
  help?: boolean;
  scenarios?: string;
  format?: string[];
  iterations?: number;
  timeout?: number;
  parallel?: boolean;
  'dom-harness'?: boolean;
}

/**
 * Drag test result interface
 */
interface DragTestResult {
  scenarioId: string;
  scenarioName: string;
  scenarioType: string;
  iterations: number;
  results: {
    iteration: number;
    success: boolean;
    latencyMs: number;
    valid: boolean;
    reason?: string;
    error?: string;
  }[];
  summary: {
    totalIterations: number;
    successfulIterations: number;
    failedIterations: number;
    averageLatencyMs: number;
    minLatencyMs: number;
    maxLatencyMs: number;
    successRate: number;
    validationConsistency: number;
    performanceScore: number;
  };
  performance: {
    passedThresholds: boolean;
    latencyThresholdMs: number;
    successRateThreshold: number;
    thresholdViolations: string[];
  };
}

/**
 * Diagnostics bundle interface
 */
interface DiagnosticsBundle {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  duration: number;
  config: DragDiagnosticsConfig;
  results: DragTestResult[];
  summary: {
    totalScenarios: number;
    successfulScenarios: number;
    failedScenarios: number;
    totalIterations: number;
    overallSuccessRate: number;
    averageLatencyMs: number;
    performanceScore: number;
    kpiAchieved: boolean;
  };
  telemetry: {
    eventId: string;
    timestamp: string;
    metadata: Record<string, any>;
  };
}

/**
 * Mock Idle Village configuration for testing
 */
function createMockIdleVillageConfig(): IdleVillageConfig {
  return {
    activities: {
      'forest-work': {
        id: 'forest-work',
        name: 'Forest Work',
        description: 'Gather resources from the forest',
        statRequirements: {
          allOf: ['strength'],
          anyOf: [],
          noneOf: [],
        },
        fatigueThreshold: 80,
        maxCrew: 3,
        baseProduction: { wood: 10 },
        duration: 30000,
      },
      'mining-operation': {
        id: 'mining-operation',
        name: 'Mining Operation',
        description: 'Extract minerals from the mine',
        statRequirements: {
          allOf: ['strength'],
          anyOf: ['endurance'],
          noneOf: ['intelligence'],
        },
        fatigueThreshold: 70,
        maxCrew: 2,
        baseProduction: { stone: 8, iron: 3 },
        duration: 45000,
      },
      'crafting-station': {
        id: 'crafting-station',
        name: 'Crafting Station',
        description: 'Craft items and tools',
        statRequirements: {
          allOf: ['dexterity'],
          anyOf: ['intelligence'],
          noneOf: [],
        },
        fatigueThreshold: 60,
        maxCrew: 2,
        baseProduction: { tools: 2 },
        duration: 20000,
      },
    },
    global: {
      invasionRules: {},
    },
  } as IdleVillageConfig;
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
        description: 'Output directory for diagnostic reports',
      },
      verbose: {
        type: 'boolean',
        description: 'Enable verbose logging',
      },
      'dry-run': {
        type: 'boolean',
        description: 'Show what would be done without executing',
      },
      help: {
        type: 'boolean',
        description: 'Show help information',
      },
      scenarios: {
        type: 'string',
        description: 'Comma-separated list of scenario IDs to test',
      },
      format: {
        type: 'string',
        description: 'Output formats (json,markdown,csv)',
      },
      iterations: {
        type: 'string',
        description: 'Number of iterations per scenario',
      },
      timeout: {
        type: 'string',
        description: 'Scenario timeout in milliseconds',
      },
      parallel: {
        type: 'boolean',
        description: 'Enable parallel execution',
      },
      'dom-harness': {
        type: 'boolean',
        description: 'Use DOM harness for drag simulation',
      },
    },
    allowPositionals: false,
  });

  const options: CLIOptions = {
    preset: values.preset,
    output: values.output,
    verbose: values.verbose || false,
    'dry-run': values['dry-run'] || false,
    help: values.help || false,
    scenarios: values.scenarios,
    format: values.format ? values.format.split(',').map(f => f.trim()) : undefined,
    iterations: values.iterations ? parseInt(values.iterations, 10) : undefined,
    timeout: values.timeout ? parseInt(values.timeout, 10) : undefined,
    parallel: values.parallel,
    'dom-harness': values['dom-harness'],
  };

  return options;
}

/**
 * Load configuration based on options
 */
async function loadConfiguration(options: CLIOptions): Promise<DragDiagnosticsConfig> {
  let config: DragDiagnosticsConfig;

  if (options.preset) {
    const presetKey = options.preset as DragDiagnosticsPreset;
    if (!(presetKey in DRAG_DIAGNOSTICS_PRESETS)) {
      throw new Error(`Unknown preset: ${options.preset}. Available: ${Object.keys(DRAG_DIAGNOSTICS_PRESETS).join(', ')}`);
    }
    config = { ...DRAG_DIAGNOSTICS_PRESETS[presetKey] };
  } else {
    config = { ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG };
  }

  // Apply CLI overrides
  if (options.output) {
    config.output.outputDir = options.output;
  }
  if (options.verbose) {
    config.execution.verbose = true;
  }
  if (options.iterations !== undefined) {
    config.scenarios.forEach(scenario => {
      scenario.iterations = options.iterations!;
    });
  }
  if (options.timeout !== undefined) {
    config.execution.scenarioTimeoutMs = options.timeout;
  }
  if (options.parallel !== undefined) {
    config.execution.parallelExecution = options.parallel;
  }
  if (options['dom-harness'] !== undefined) {
    config.execution.useDOMHarness = options['dom-harness'];
  }
  if (options.format) {
    config.output.formats = options.format as any[];
  }

  // Filter scenarios if specified
  if (options.scenarios) {
    const scenarioIds = options.scenarios.split(',').map(s => s.trim());
    config.scenarios = config.scenarios.filter(scenario => 
      scenarioIds.includes(scenario.id)
    );
  }

  return config;
}

/**
 * Execute drag test for a scenario
 */
async function executeDragTest(
  scenario: DragScenario,
  config: DragDiagnosticsConfig,
  mockConfig: IdleVillageConfig
): Promise<DragTestResult> {
  const startTime = performance.now();
  const results: DragTestResult['results'] = [];
  
  if (config.execution.verbose) {
    console.log(`🔍 Testing scenario: ${scenario.name} (${scenario.id})`);
  }

  for (let iteration = 0; iteration < scenario.iterations; iteration++) {
    const iterationStart = performance.now();
    
    try {
      // Create diagnostics logger
      const diagnostics = {
        debug: config.execution.verbose ? (message: string, payload: Record<string, unknown>) => {
          if (config.execution.verbose) {
            console.log(`  [DEBUG] ${message}:`, payload);
          }
        } : () => {},
        info: config.execution.verbose ? (message: string, payload: Record<string, unknown>) => {
          if (config.execution.verbose) {
            console.log(`  [INFO] ${message}:`, payload);
          }
        } : () => {},
        warn: config.execution.verbose ? (message: string, payload: Record<string, unknown>) => {
          if (config.execution.verbose) {
            console.warn(`  [WARN] ${message}:`, payload);
          }
        } : () => {},
      };

      // Execute validation
      const validationResult = validateResidentDrop({
        resident: scenario.resident,
        slotId: scenario.slot.id,
        activityId: scenario.slot.activityId,
        currentAssignments: scenario.currentAssignments,
        config: mockConfig,
        diagnostics,
        enableTelemetry: false, // Disable telemetry for individual tests
      });

      const iterationEnd = performance.now();
      const latency = iterationEnd - iterationStart;

      const result = {
        iteration,
        success: true,
        latencyMs: latency,
        valid: validationResult.valid,
        reason: validationResult.reason,
      };

      results.push(result);

      if (config.execution.verbose) {
        console.log(`    Iteration ${iteration + 1}: ${validationResult.valid ? 'VALID' : 'INVALID'} (${latency.toFixed(2)}ms)${validationResult.reason ? ` - ${validationResult.reason}` : ''}`);
      }

    } catch (error) {
      const iterationEnd = performance.now();
      const latency = iterationEnd - iterationStart;

      const result = {
        iteration,
        success: false,
        latencyMs: latency,
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };

      results.push(result);

      if (config.execution.verbose) {
        console.log(`    Iteration ${iteration + 1}: ERROR (${latency.toFixed(2)}ms) - ${result.error}`);
      }
    }
  }

  const endTime = performance.now();
  const totalDuration = endTime - startTime;

  // Calculate summary statistics
  const successfulIterations = results.filter(r => r.success).length;
  const validIterations = results.filter(r => r.valid).length;
  const latencies = results.map(r => r.latencyMs);
  const averageLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  const successRate = successfulIterations / results.length;
  const validationConsistency = validIterations / results.length;

  // Performance score (0-100)
  const latencyScore = Math.max(0, 100 - (averageLatency / (scenario.thresholds?.maxLatencyMs || 50)) * 100);
  const successScore = successRate * 100;
  const consistencyScore = validationConsistency * 100;
  const performanceScore = (latencyScore + successScore + consistencyScore) / 3;

  // Check thresholds
  const thresholds = scenario.thresholds || { maxLatencyMs: 50, minSuccessRate: 1.0 };
  const passedThresholds = averageLatency <= thresholds.maxLatencyMs && successRate >= thresholds.minSuccessRate;
  const thresholdViolations: string[] = [];
  
  if (averageLatency > thresholds.maxLatencyMs) {
    thresholdViolations.push(`Latency ${averageLatency.toFixed(2)}ms > ${thresholds.maxLatencyMs}ms`);
  }
  if (successRate < thresholds.minSuccessRate) {
    thresholdViolations.push(`Success rate ${(successRate * 100).toFixed(1)}% < ${(thresholds.minSuccessRate * 100).toFixed(1)}%`);
  }

  const testResult: DragTestResult = {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    scenarioType: scenario.type,
    iterations: scenario.iterations,
    results,
    summary: {
      totalIterations: results.length,
      successfulIterations,
      failedIterations: results.length - successfulIterations,
      averageLatencyMs: averageLatency,
      minLatencyMs: minLatency,
      maxLatencyMs: maxLatency,
      successRate,
      validationConsistency,
      performanceScore,
    },
    performance: {
      passedThresholds,
      latencyThresholdMs: thresholds.maxLatencyMs,
      successRateThreshold: thresholds.minSuccessRate,
      thresholdViolations,
    },
  };

  if (config.execution.verbose) {
    console.log(`✅ ${scenario.name}: ${passedThresholds ? 'PASS' : 'FAIL'} (Score: ${performanceScore.toFixed(1)}/100)`);
    if (thresholdViolations.length > 0) {
      console.log(`    Violations: ${thresholdViolations.join(', ')}`);
    }
  }

  return testResult;
}

/**
 * Generate checksum for diagnostics bundle
 */
function generateChecksum(bundle: DiagnosticsBundle): string {
  const bundleString = JSON.stringify(bundle, null, 2);
  return createHash('sha256').update(bundleString).digest('hex');
}

/**
 * Export diagnostics bundle to different formats
 */
function exportBundle(bundle: DiagnosticsBundle, config: DragDiagnosticsConfig): Record<string, string> {
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
function generateMarkdownReport(bundle: DiagnosticsBundle): string {
  const { summary, results } = bundle;
  
  let markdown = `# ${bundle.name}\n\n`;
  markdown += `**Description**: ${bundle.description}\n\n`;
  markdown += `**Timestamp**: ${bundle.timestamp}\n`;
  markdown += `**Duration**: ${bundle.duration}ms\n`;
  markdown += `**Diagnostics ID**: ${bundle.id}\n\n`;

  markdown += `## Summary\n\n`;
  markdown += `- **Total Scenarios**: ${summary.totalScenarios}\n`;
  markdown += `- **Successful**: ${summary.successfulScenarios}\n`;
  markdown += `- **Failed**: ${summary.failedScenarios}\n`;
  markdown += `- **Overall Success Rate**: ${(summary.overallSuccessRate * 100).toFixed(1)}%\n`;
  markdown += `- **Average Latency**: ${summary.averageLatencyMs.toFixed(2)}ms\n`;
  markdown += `- **Performance Score**: ${summary.performanceScore.toFixed(1)}/100\n`;
  markdown += `- **KPI Achieved**: ${summary.kpiAchieved ? '✅ YES' : '❌ NO'}\n\n`;

  // Latency chart (ASCII)
  if (bundle.config.output.generateLatencyChart) {
    markdown += `## Latency Performance Chart\n\n`;
    markdown += generateLatencyChart(results);
    markdown += `\n`;
  }

  markdown += `## Scenario Results\n\n`;
  markdown += `| Scenario | Type | Iterations | Success Rate | Avg Latency | Score | Status |\n`;
  markdown += `|----------|------|------------|-------------|------------|-------|--------|\n`;

  results.forEach(result => {
    const status = result.performance.passedThresholds ? '✅' : '❌';
    const successRate = (result.summary.successRate * 100).toFixed(1);
    const avgLatency = result.summary.averageLatencyMs.toFixed(2);
    const score = result.summary.performanceScore.toFixed(1);
    
    markdown += `| ${result.scenarioName} | ${result.scenarioType} | ${result.summary.totalIterations} | ${successRate}% | ${avgLatency}ms | ${score}/100 | ${status} |\n`;
  });

  if (bundle.config.output.includeDetailedResults) {
    markdown += `\n## Detailed Results\n\n`;
    results.forEach(result => {
      markdown += `### ${result.scenarioName}\n\n`;
      markdown += `**Type**: ${result.scenarioType}\n`;
      markdown += `**Performance**:\n`;
      markdown += `- Success Rate: ${(result.summary.successRate * 100).toFixed(1)}%\n`;
      markdown += `- Average Latency: ${result.summary.averageLatencyMs.toFixed(2)}ms\n`;
      markdown += `- Min/Max Latency: ${result.summary.minLatencyMs.toFixed(2)}ms / ${result.summary.maxLatencyMs.toFixed(2)}ms\n`;
      markdown += `- Performance Score: ${result.summary.performanceScore.toFixed(1)}/100\n`;
      
      if (result.performance.thresholdViolations.length > 0) {
        markdown += `**Threshold Violations**:\n`;
        result.performance.thresholdViolations.forEach(violation => {
          markdown += `- ${violation}\n`;
        });
      }
      
      markdown += `\n`;
    });
  }

  return markdown;
}

/**
 * Generate simple ASCII latency chart
 */
function generateLatencyChart(results: DragTestResult[]): string {
  const maxLatency = Math.max(...results.map(r => r.summary.averageLatencyMs));
  const chartWidth = 50;
  
  let chart = '```\n';
  chart += 'Latency Performance (ms)\n';
  chart += ''.padEnd(chartWidth + 10, '-') + '\n';
  
  results.forEach(result => {
    const barLength = Math.round((result.summary.averageLatencyMs / maxLatency) * chartWidth);
    const bar = '█'.repeat(barLength).padEnd(chartWidth, ' ');
    const label = result.scenarioName.padEnd(20, ' ');
    const value = `${result.summary.averageLatencyMs.toFixed(1)}ms`.padStart(8, ' ');
    chart += `${label} |${bar}| ${value}\n`;
  });
  
  chart += ''.padEnd(chartWidth + 10, '-') + '\n';
  chart += '```\n';
  
  return chart;
}

/**
 * Generate CSV report
 */
function generateCSVReport(bundle: DiagnosticsBundle): string {
  const { results } = bundle;
  
  let csv = 'Scenario ID,Scenario Name,Type,Iterations,Successful,Failed,Success Rate,Avg Latency (ms),Min Latency (ms),Max Latency (ms),Performance Score,Status\n';
  
  results.forEach(result => {
    const status = result.performance.passedThresholds ? 'PASS' : 'FAIL';
    const successRate = (result.summary.successRate * 100).toFixed(2);
    const avgLatency = result.summary.averageLatencyMs.toFixed(2);
    const minLatency = result.summary.minLatencyMs.toFixed(2);
    const maxLatency = result.summary.maxLatencyMs.toFixed(2);
    const score = result.summary.performanceScore.toFixed(2);
    
    csv += `${result.scenarioId},"${result.scenarioName}",${result.scenarioType},${result.summary.totalIterations},${result.summary.successfulIterations},${result.summary.failedIterations},${successRate},${avgLatency},${minLatency},${maxLatency},${score},${status}\n`;
  });

  return csv;
}

/**
 * Emit telemetry event
 */
function emitTelemetry(bundle: DiagnosticsBundle): void {
  if (!bundle.config.telemetry.enabled) return;
  
  console.log('📊 Telemetry emitted:', bundle.config.telemetry.eventName);
  console.log(`Event ID: ${bundle.telemetry.eventId}`);
  console.log(`Timestamp: ${bundle.telemetry.timestamp}`);
  console.log(`Bundle ID: ${bundle.id}`);
  console.log(`Scenarios: ${bundle.summary.totalScenarios}`);
  console.log(`Success Rate: ${(bundle.summary.overallSuccessRate * 100).toFixed(1)}%`);
  console.log(`Performance Score: ${bundle.summary.performanceScore.toFixed(1)}/100`);
}

/**
 * Create evidence log
 */
function createEvidenceLog(bundle: DiagnosticsBundle, exitCode: number): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const logPath = join(bundle.config.output.outputDir, `np-103-phasee-drag-diagnostics-${timestamp}.log`);
  
  let logContent = `# NP-103 – Idle Village Drag Diagnostics CLI\n\n`;
  logContent += `## Evidence Log – ${new Date().toISOString()}\n\n`;
  logContent += `### Status: ${exitCode === 0 ? 'COMPLETATO' : 'BLOCCATO'}\n\n`;
  logContent += `### Bundle Information\n`;
  logContent += `- **Bundle ID**: ${bundle.id}\n`;
  logContent += `- **Name**: ${bundle.name}\n`;
  logContent += `- **Timestamp**: ${bundle.timestamp}\n`;
  logContent += `- **Duration**: ${bundle.duration}ms\n\n`;
  
  logContent += `### Results Summary\n`;
  logContent += `- **Total Scenarios**: ${bundle.summary.totalScenarios}\n`;
  logContent += `- **Successful**: ${bundle.summary.successfulScenarios}\n`;
  logContent += `- **Failed**: ${bundle.summary.failedScenarios}\n`;
  logContent += `- **Overall Success Rate**: ${(bundle.summary.overallSuccessRate * 100).toFixed(1)}%\n`;
  logContent += `- **Average Latency**: ${bundle.summary.averageLatencyMs.toFixed(2)}ms\n`;
  logContent += `- **Performance Score**: ${bundle.summary.performanceScore.toFixed(1)}/100\n`;
  logContent += `- **KPI Achieved**: ${bundle.summary.kpiAchieved ? 'YES' : 'NO'}\n\n`;
  
  logContent += `### Exit Code: ${exitCode}\n\n`;
  
  logContent += `### Files Generated\n`;
  bundle.config.output.formats.forEach(format => {
    const filename = `${bundle.id}.${format}`;
    logContent += `- ${filename}\n`;
  });
  
  logContent += `\n### Telemetry Event\n`;
  logContent += `- **Event**: ${bundle.config.telemetry.eventName}\n`;
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
    console.log('🚀 NP-103 – Idle Village Drag Diagnostics CLI');

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
      console.log(`📊 Scenarios: ${config.scenarios.length}`);
      console.log(`🔧 Formats: ${config.output.formats.join(', ')}`);
    }

    if (options['dry-run']) {
      console.log('🔍 DRY RUN - No tests will be executed');
      console.log(`📁 Output directory: ${config.output.outputDir}`);
      console.log(`🎯 Scenarios: ${config.scenarios.map(s => s.id).join(', ')}`);
      return;
    }

    // Create mock configuration
    const mockConfig = createMockIdleVillageConfig();

    // Execute drag tests
    console.log('🔍 Starting drag diagnostics...');
    const results: DragTestResult[] = [];

    if (config.execution.parallelExecution) {
      // Parallel execution
      const promises = config.scenarios.map(scenario => 
        executeDragTest(scenario, config, mockConfig)
      );
      const testResults = await Promise.all(promises);
      results.push(...testResults);
    } else {
      // Sequential execution
      for (const scenario of config.scenarios) {
        const result = await executeDragTest(scenario, config, mockConfig);
        results.push(result);
        
        if (!result.performance.passedThresholds && !config.execution.continueOnFailure) {
          console.log(`⚠️ Stopping execution due to failure in ${scenario.scenarioName}`);
          break;
        }
      }
    }

    // Calculate summary
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    const successfulScenarios = results.filter(r => r.performance.passedThresholds).length;
    const overallSuccessRate = results.length > 0 ? successfulScenarios / results.length : 0;
    const averageLatency = results.length > 0 
      ? results.reduce((sum, r) => sum + r.summary.averageLatencyMs, 0) / results.length 
      : 0;
    const performanceScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.summary.performanceScore, 0) / results.length 
      : 0;
    const kpiAchieved = overallSuccessRate >= 0.8 && averageLatency <= 50;

    // Create diagnostics bundle
    const bundle: DiagnosticsBundle = {
      id: `drag-diagnostics-${Date.now()}`,
      name: config.name,
      description: config.description,
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      config,
      results,
      summary: {
        totalScenarios: results.length,
        successfulScenarios,
        failedScenarios: results.length - successfulScenarios,
        totalIterations: results.reduce((sum, r) => sum + r.summary.totalIterations, 0),
        overallSuccessRate,
        averageLatencyMs: averageLatency,
        performanceScore,
        kpiAchieved,
      },
      telemetry: {
        eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        metadata: {
          version: config.version,
          nodeVersion: process.version,
          platform: process.platform,
          executionMode: config.execution.parallelExecution ? 'parallel' : 'sequential',
          useDOMHarness: config.execution.useDOMHarness,
        },
      },
    };

    // Export bundle
    const exports = exportBundle(bundle, config);
    
    // Write output files
    mkdirSync(config.output.outputDir, { recursive: true });
    
    config.output.formats.forEach(format => {
      const filename = config.output.createTimestampedFilenames 
        ? `${bundle.id}.${format}`
        : `drag-diagnostics.${format}`;
      const filepath = join(config.output.outputDir, filename);
      writeFileSync(filepath, exports[format], 'utf8');
      console.log(`📁 ${format.toUpperCase()} export: ${filepath}`);
    });

    // Emit telemetry
    emitTelemetry(bundle);

    // Determine exit code
    const exitCode = kpiAchieved ? 0 : 1;

    // Create evidence log
    createEvidenceLog(bundle, exitCode);

    // Display results
    console.log('\n📊 Diagnostics Bundle Summary:');
    console.log(`✅ Successful: ${successfulScenarios}/${results.length} scenarios`);
    console.log(`📈 Success Rate: ${(overallSuccessRate * 100).toFixed(1)}%`);
    console.log(`⏱️ Average Latency: ${averageLatency.toFixed(2)}ms`);
    console.log(`🎯 Performance Score: ${performanceScore.toFixed(1)}/100`);
    console.log(`🏆 KPI Achieved: ${kpiAchieved ? 'YES' : 'NO'}`);

    if (exitCode > 0) {
      console.log('\n❌ DIAGNOSTICS FAILED');
      console.log('Review the detailed reports for failed validations.');
    } else {
      console.log('\n✅ DIAGNOSTICS COMPLETED');
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
NP-103 – Idle Village Drag Diagnostics CLI

USAGE:
  node dragDiagnostics.ts [OPTIONS]

OPTIONS:
  --preset <name>        Configuration preset (quick, comprehensive, performance)
  --output <dir>         Output directory for diagnostic reports
  --scenarios <list>     Comma-separated list of scenario IDs
  --format <list>        Output formats (json,markdown,csv)
  --iterations <number>  Number of iterations per scenario
  --timeout <ms>         Scenario timeout in milliseconds
  --parallel             Enable parallel execution
  --dom-harness          Use DOM harness for drag simulation
  --verbose              Enable verbose logging
  --dry-run              Show what would be done without executing
  --help                 Show this help information

EXAMPLES:
  node dragDiagnostics.ts --preset quick
  node dragDiagnostics.ts --preset comprehensive --verbose
  node dragDiagnostics.ts --scenarios valid-basic-drop,invalid-stat-mismatch --format json,markdown
  node dragDiagnostics.ts --performance --iterations 100 --parallel

PRESETS:
  quick          Fast validation for CI/CD (2 scenarios, sequential)
  comprehensive  Full validation suite (all scenarios, parallel)
  performance    Performance-focused testing (strict thresholds, DOM harness)
`);
}

// Execute CLI
const importPath = decodeURIComponent(import.meta.url).replace('file://', '');
const processPath = process.argv[1];

if (importPath === processPath) {
  main().catch(console.error);
}
