#!/usr/bin/env tsx

/**
 * Persistence Chaos Monkey CLI Script
 * 
 * Command-line tool for running chaos scenarios against PersistenceService
 * with fault injection, KPI tracking, and comprehensive reporting.
 */

import { program } from 'commander';
import { createSandboxDiagnostics } from '../../src/ui/idleVillage/utils/sandboxDiagnostics';
import { PersistenceChaosHarness, DEFAULT_CHAOS_HARNESS_CONFIG, CHAOS_HARNESS_PRESETS } from '../../src/shared/testing/PersistenceChaosHarness';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { ChaosHarnessPreset, ChaosExportConfig } from '../../src/shared/testing/PersistenceChaosConfig';

const diagnostics = createSandboxDiagnostics('PersistenceChaosMonkeyCLI', 'scripts');

/**
 * CLI configuration
 */
interface CLIConfig {
  scenarios: string[];
  preset?: ChaosHarnessPreset;
  namespace: string;
  outputDir: string;
  verbose: boolean;
  dryRun: boolean;
  timeout: number;
  exportFormats: ('json' | 'csv' | 'markdown')[];
  includeRawResults: boolean;
  includeSummary: boolean;
  includeKPI: boolean;
  includeFaults: boolean;
}

/**
 * Default CLI configuration
 */
const DEFAULT_CLI_CONFIG: CLIConfig = {
  scenarios: [],
  namespace: 'chaos-test-cli',
  outputDir: 'test-results',
  verbose: false,
  dryRun: false,
  timeout: 60000, // 60 seconds
  exportFormats: ['json', 'markdown'],
  includeRawResults: true,
  includeSummary: true,
  includeKPI: true,
  includeFaults: true,
};

/**
 * Generate timestamp for filenames
 */
function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString()
    .replace(/[:.]/g, '-')
    .replace(/T/, '-')
    .slice(0, -5); // Remove milliseconds
}

/**
 * Generate report filename
 */
function generateReportFilename(scenarioIds: string[], format: string): string {
  const timestamp = generateTimestamp();
  const scenarioPart = scenarioIds.length === 1 
    ? scenarioIds[0] 
    : `multiple-${scenarioIds.length}`;
  return `np-061-persistence-chaos-${scenarioPart}-${timestamp}.${format}`;
}

/**
 * Create output directory if it doesn't exist
 */
function ensureOutputDirectory(outputDir: string): void {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
}

/**
 * Run chaos scenarios
 */
async function runChaosScenarios(config: CLIConfig): Promise<void> {
  if (config.scenarios.length === 0 && !config.preset) {
    throw new Error('No scenarios specified. Use --scenarios or --preset');
  }

  diagnostics.info('Initializing Persistence Chaos Harness', { config });
  
  // Create harness with configuration
  const harnessConfig = config.preset 
    ? CHAOS_HARNESS_PRESETS[config.preset]
    : DEFAULT_CHAOS_HARNESS_CONFIG;
  
  const harness = new PersistenceChaosHarness(harnessConfig, config.namespace);
  
  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE - No actual chaos will be injected');
    console.log(`Namespace: ${config.namespace}`);
    console.log(`Scenarios: ${config.scenarios.join(', ')}`);
    console.log(`Preset: ${config.preset || 'none'}`);
    console.log(`Timeout: ${config.timeout}ms`);
    return;
  }

  // Set up event listeners
  harness.on('scenarioStarted', ({ scenarioId, scenario }) => {
    console.log(`🚀 Started scenario: ${scenario.name} (${scenarioId})`);
    if (config.verbose) {
      console.log(`   Duration: ${scenario.duration}ms`);
      console.log(`   Faults: ${scenario.faults.length}`);
      console.log(`   Warmup: ${scenario.warmupPeriod}ms`);
      console.log(`   Cooldown: ${scenario.cooldownPeriod}ms`);
    }
  });

  harness.on('scenarioStopped', ({ scenarioId, result }) => {
    console.log(`✅ Completed scenario: ${result.scenarioName} (${scenarioId})`);
    console.log(`   Operations: ${result.summary.totalOperations}`);
    console.log(`   Success Rate: ${((1 - result.summary.errorRate) * 100).toFixed(2)}%`);
    console.log(`   Average Latency: ${result.summary.averageLatency.toFixed(2)}ms`);
    console.log(`   Faults Injected: ${result.faultSummary.totalFaultsInjected}`);
  });

  harness.on('operationCompleted', (result) => {
    if (config.verbose) {
      const status = result.success ? '✅' : '❌';
      const faults = result.injectedFaults.length > 0 ? ` [${result.injectedFaults.join(',')}]` : '';
      console.log(`   ${status} ${result.operation} (${result.duration}ms) ${faults}`);
    }
  });

  harness.on('telemetry', (event) => {
    if (config.verbose) {
      console.log(`📊 Telemetry: ${event.eventName}`);
    }
  });

  // Start scenarios
  const startTime = Date.now();
  const activeScenarios = new Set<string>();
  
  try {
    // Start all scenarios
    for (const scenarioId of config.scenarios) {
      await harness.startScenario(scenarioId);
      activeScenarios.add(scenarioId);
    }
    
    console.log(`🎯 Running ${activeScenarios.size} chaos scenarios...`);
    
    // Wait for completion or timeout
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Chaos test timeout after ${config.timeout}ms`));
      }, config.timeout);
      
      const checkCompletion = () => {
        if (harness.getState().status === 'idle') {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkCompletion, 1000);
        }
      };
      
      checkCompletion();
    });
    
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    console.log(`🏁 Chaos testing completed in ${(totalDuration / 1000).toFixed(2)}s`);
    
    // Generate reports
    await generateReports(harness, config, activeScenarios);
    
    // Check for failures and set exit code
    const state = harness.getState();
    const errorRate = state.metrics.errorRate;
    const maxErrorRate = 0.5; // 50% error rate threshold
    
    if (errorRate > maxErrorRate) {
      console.error(`❌ High error rate detected: ${(errorRate * 100).toFixed(2)}% (threshold: ${(maxErrorRate * 100).toFixed(2)}%)`);
      process.exit(1);
    }
    
    console.log(`✅ Chaos testing completed successfully`);
    console.log(`   Error Rate: ${(errorRate * 100).toFixed(2)}%`);
    console.log(`   Total Operations: ${state.metrics.totalOperations}`);
    console.log(`   Faults Injected: ${state.metrics.totalFaultsInjected}`);
    
  } catch (error) {
    console.error(`❌ Chaos testing failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Cleanup
    harness.destroy();
  }
}

/**
 * Generate reports
 */
async function generateReports(
  harness: PersistenceChaosHarness, 
  config: CLIConfig, 
  scenarioIds: Set<string>
): Promise<void> {
  ensureOutputDirectory(config.outputDir);
  
  const exportConfig: ChaosExportConfig = {
    includeRawResults: config.includeRawResults,
    includeSummary: config.includeSummary,
    includeKPI: config.includeKPI,
    includeFaults: config.includeFaults,
    format: 'json', // Will be overridden
    scenarios: Array.from(scenarioIds),
  };
  
  for (const format of config.exportFormats) {
    try {
      exportConfig.format = format;
      const reportData = harness.exportResults(exportConfig);
      const filename = generateReportFilename(Array.from(scenarioIds), format);
      const filepath = join(config.outputDir, filename);
      
      writeFileSync(filepath, reportData, 'utf-8');
      console.log(`📄 Generated ${format.toUpperCase()} report: ${filename}`);
      
      // Also create a symlink with a predictable name for CI
      const latestFilename = `latest-persistence-chaos.${format}`;
      const latestFilepath = join(config.outputDir, latestFilename);
      
      try {
        // Remove existing symlink if it exists
        if (existsSync(latestFilepath)) {
          const stats = require('fs').lstatSync(latestFilepath);
          if (stats.isSymbolicLink()) {
            require('fs').unlinkSync(latestFilepath);
          }
        }
        
        // Create new symlink
        require('fs').symlinkSync(filename, latestFilepath);
        console.log(`🔗 Created symlink: ${latestFilename}`);
      } catch (error) {
        // Symlink creation is optional
        if (config.verbose) {
          console.warn(`Warning: Could not create symlink: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to generate ${format} report: ${error.message}`);
    }
  }
}

/**
 * List available scenarios
 */
function listScenarios(): void {
  console.log('Available Chaos Scenarios:');
  console.log('');
  
  const scenarios = DEFAULT_CHAOS_HARNESS_CONFIG.scenarios;
  
  scenarios.forEach(scenario => {
    const status = scenario.enabled ? '✅' : '❌';
    console.log(`${status} ${scenario.id} - ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log(`   Duration: ${scenario.duration}ms`);
    console.log(`   Faults: ${scenario.faults.length}`);
    console.log(`   Severity: ${scenario.faults.map(f => f.severity).join(', ')}`);
    console.log('');
  });
  
  console.log('Available Presets:');
  console.log('');
  
  const presets = Object.keys(CHAOS_HARNESS_PRESETS);
  presets.forEach(preset => {
    console.log(`📦 ${preset} - ${preset} preset`);
  });
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    const program = program
      .name('persistence-chaos-monkey')
      .description('PersistenceService Chaos Monkey - Fault injection testing for persistence layer')
      .version('1.0.0')
      .option('-s, --scenarios <scenarios...>', 'Chaos scenario IDs to run', [])
      .option('-p, --preset <preset>', 'Use preset configuration (light, medium, heavy, performance, reliability)')
      .option('-n, --namespace <namespace>', 'Namespace for testing', 'chaos-test-cli')
      .option('-o, --output <dir>', 'Output directory for reports', 'test-results')
      .option('-v, --verbose', 'Enable verbose logging', false)
      .option('-d, --dry-run', 'Dry run mode (no actual chaos)', false)
      .option('-t, --timeout <ms>', 'Global timeout in milliseconds', '60000')
      .option('-f, --formats <formats...>', 'Export formats (json, csv, markdown)', ['json', 'markdown'])
      .option('--no-raw-results', 'Exclude raw operation results', false)
      .option('--no-summary', 'Exclude summary statistics', false)
      .option('--no-kpi', 'Exclude KPI metrics', false)
      .option('--no-faults', 'Exclude fault injection details', false)
      .option('--list', 'List available scenarios and presets', false)
      .parse();
    
    // Parse options
    const config: CLIConfig = {
      ...DEFAULT_CLI_CONFIG,
      scenarios: program.opts().scenarios || [],
      preset: program.opts().preset as ChaosHarnessPreset | undefined,
      namespace: program.opts().namespace || DEFAULT_CLI_CONFIG.namespace,
      outputDir: program.opts().output || DEFAULT_CLI_CONFIG.outputDir,
      verbose: program.opts().verbose || DEFAULT_CLI_CONFIG.verbose,
      dryRun: program.opts().dryRun || DEFAULT_CLI_CONFIG.dryRun,
      timeout: parseInt(program.opts().timeout || DEFAULT_CLI_CONFIG.timeout.toString()),
      exportFormats: program.opts().formats || DEFAULT_CLI_CONFIG.exportFormats,
      includeRawResults: !program.opts().noRawResults,
      includeSummary: !program.opts().noSummary,
      includeKPI: !program.opts().noKpi,
      includeFaults: !program.opts().noFaults,
    };
    
    // Handle list option
    if (program.opts().list) {
      listScenarios();
      return;
    }
    
    // Validate configuration
    if (config.scenarios.length === 0 && !config.preset) {
      console.error('Error: No scenarios specified. Use --scenarios or --preset');
      console.error('Use --list to see available scenarios and presets.');
      process.exit(1);
    }
    
    if (config.preset && config.scenarios.length > 0) {
      console.warn('Warning: Both --scenarios and --preset specified. Using preset.');
      config.scenarios = [];
    }
    
    // Validate scenarios
    if (config.scenarios.length > 0) {
      const availableScenarios = DEFAULT_CHAOS_HARNESS_CONFIG.scenarios.map(s => s.id);
      const invalidScenarios = config.scenarios.filter(s => !availableScenarios.includes(s));
      
      if (invalidScenarios.length > 0) {
        console.error(`Error: Invalid scenarios: ${invalidScenarios.join(', ')}`);
        console.error('Use --list to see available scenarios.');
        process.exit(1);
      }
    }
    
    // Validate preset
    if (config.preset && !Object.keys(CHAOS_HARNESS_PRESETS).includes(config.preset)) {
      console.error(`Error: Invalid preset: ${config.preset}`);
      console.error('Available presets:', Object.keys(CHAOS_HARNESS_PRESETS).join(', '));
      process.exit(1);
    }
    
    // Validate formats
    const validFormats = ['json', 'csv', 'markdown'];
    const invalidFormats = config.exportFormats.filter(f => !validFormats.includes(f));
    
    if (invalidFormats.length > 0) {
      console.error(`Error: Invalid formats: ${invalidFormats.join(', ')}`);
      console.error('Available formats:', validFormats.join(', '));
      process.exit(1);
    }
    
    // Run chaos scenarios
    await runChaosScenarios(config);
    
  } catch (error) {
    console.error(`❌ Fatal error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}
