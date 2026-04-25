#!/usr/bin/env node

/**
 * Stress Testing CLI Orchestrator
 * 
 * CLI tool that orchestrates the complete stress testing pipeline:
 * Generator → Calculator → Exporter with comprehensive logging and metadata storage.
 * 
 * @module runStressPipeline
 * @since 2026-01-11
 * @author Atlas-CLI
 */

import { Command } from 'commander';
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';
import { StressTestArchetypeGenerator } from '@/balancing/stressTesting/StressTestArchetypeGenerator';
import { MarginalUtilityCalculator } from '@/balancing/stressTesting/MarginalUtilityCalculator';
import { saveData } from '@/shared/persistence/PersistenceService';
import { exportStressTestTelemetry, getStressTestTelemetrySummary } from '@/analytics/telemetry/telemetryProvider';
import type { BalancerConfig } from '@/balancing/config/types';
import type { StressTestArchetype } from '@/balancing/stressTesting/types';
import type { MarginalUtilityAnalysis } from '@/balancing/stressTesting/MarginalUtilityTypes';

/**
 * CLI configuration interface
 */
interface CLIConfig {
  iterations: number;
  seed: number;
  exportOnly: boolean;
  outputPath: string;
  enableTelemetry: boolean;
  enableLogging: boolean;
  configPath?: string;
}

/**
 * Run metadata for tracking and persistence
 */
interface RunMetadata {
  id: string;
  timestamp: string;
  config: CLIConfig;
  balancerConfigHash: string;
  duration: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
  results?: {
    archetypesGenerated: number;
    simulationsRun: number;
    analysesCompleted: number;
    exportPaths: string[];
  };
}

/**
 * Default CLI configuration
 */
const DEFAULT_CLI_CONFIG: CLIConfig = {
  iterations: 10000,
  seed: Date.now(),
  exportOnly: false,
  outputPath: '/data/exports/stressTesting',
  enableTelemetry: true,
  enableLogging: true,
};

/**
 * Calculate hash of balancer config for change detection
 */
function calculateConfigHash(config: BalancerConfig): string {
  const configString = JSON.stringify(config, Object.keys(config).sort());
  return Buffer.from(configString).toString('base64').slice(0, 16);
}

/**
 * Save run metadata to persistence
 */
async function saveRunMetadata(metadata: RunMetadata): Promise<void> {
  const metadataPath = `${DEFAULT_CLI_CONFIG.outputPath}/run-metadata-${metadata.id}.json`;
  await saveData(metadataPath, metadata);
  
  if (DEFAULT_CLI_CONFIG.enableLogging) {
    console.log(`[CLI] Saved run metadata to ${metadataPath}`);
  }
}

/**
 * Load balancer configuration
 */
async function loadBalancerConfig(configPath?: string): Promise<BalancerConfig> {
  try {
    const config = configPath 
      ? await BalancerConfigStore.loadFromFile(configPath)
      : await BalancerConfigStore.load();
    
    if (DEFAULT_CLI_CONFIG.enableLogging) {
      console.log(`[CLI] Loaded balancer config with ${Object.keys(config.stats).length} stats`);
    }
    
    return config;
  } catch (error) {
    console.error('[CLI] Failed to load balancer config:', error);
    throw new Error('Unable to load balancer configuration');
  }
}

/**
 * Generate stress test archetypes
 */
async function generateArchetypes(config: BalancerConfig, cliConfig: CLIConfig): Promise<StressTestArchetype[]> {
  const generator = new StressTestArchetypeGenerator(config, cliConfig.seed);
  
  // Generate baseline
  const baseline = generator.generateBaselineArchetype();
  
  // Generate single stat archetypes
  const singleStats = generator.generateSingleStatArchetypes(25); // pointsPerWeight
  
  // Generate pair stat archetypes
  const pairStats = generator.generatePairStatArchetypes(25);
  
  const archetypes = [baseline, ...singleStats, ...pairStats];
  
  if (cliConfig.enableLogging) {
    console.log(`[CLI] Generated ${archetypes.length} archetypes (${singleStats.length} single, ${pairStats.length} pair)`);
  }
  
  return archetypes;
}

/**
 * Run marginal utility analysis
 */
async function runAnalysis(archetypes: StressTestArchetype[], cliConfig: CLIConfig): Promise<MarginalUtilityAnalysis> {
  const calculator = new MarginalUtilityCalculator({
    simulation: {
      simulationCount: cliConfig.iterations,
      concurrencyLimit: 4,
      seed: cliConfig.seed,
    },
    thresholds: {
      opThreshold: 1.15,
      weakThreshold: 0.95,
    },
    export: {
      enableJson: true,
      enableCsv: true,
      enableMarkdown: true,
      exportPath: cliConfig.exportPath,
    },
    enableLogging: cliConfig.enableLogging,
    enableCaching: true,
  });
  
  // Set up progress callback
  calculator.setProgressCallback((progress) => {
    if (cliConfig.enableLogging) {
      console.log(`[CLI] Progress: ${Math.round(progress.progressPercentage)}% (${progress.completedPairs}/${progress.totalPairs})`);
    }
  });
  
  const analysis = await calculator.runAnalysis(archetypes, archetypes[0]); // baseline as second param
  
  if (cliConfig.enableLogging) {
    console.log(`[CLI] Analysis completed: ${analysis.summary.totalSimulations} simulations in ${analysis.summary.totalRuntimeMs}ms`);
  }
  
  return analysis;
}

/**
 * Export results and telemetry
 */
async function exportResults(analysis: MarginalUtilityAnalysis, cliConfig: CLIConfig): Promise<string[]> {
  const exportPaths: string[] = [];
  
  // Export analysis results (already done by calculator)
  exportPaths.push(`${cliConfig.exportPath}/${analysis.id}.json`);
  exportPaths.push(`${cliConfig.exportPath}/${analysis.id}.csv`);
  exportPaths.push(`${cliConfig.exportPath}/${analysis.id}.md`);
  
  // Export telemetry if enabled
  if (cliConfig.enableTelemetry) {
    try {
      const telemetryData = exportStressTestTelemetry();
      const telemetryPath = `${cliConfig.exportPath}/telemetry-${analysis.id}.json`;
      await saveData(telemetryPath, telemetryData);
      exportPaths.push(telemetryPath);
      
      if (cliConfig.enableLogging) {
        console.log(`[CLI] Exported telemetry to ${telemetryPath}`);
      }
    } catch (error) {
      console.warn('[CLI] Failed to export telemetry:', error);
    }
  }
  
  return exportPaths;
}

/**
 * Generate unique run ID
 */
function generateRunId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `stress-pipeline-${timestamp}`;
}

/**
 * Main CLI execution function
 */
async function runStressPipeline(options: Partial<CLIConfig> = {}): Promise<void> {
  const startTime = Date.now();
  const config: CLIConfig = { ...DEFAULT_CLI_CONFIG, ...options };
  const runId = generateRunId();
  
  // Initialize run metadata
  const metadata: RunMetadata = {
    id: runId,
    timestamp: new Date().toISOString(),
    config,
    balancerConfigHash: '',
    duration: 0,
    status: 'running',
  };
  
  try {
    if (config.enableLogging) {
      console.log(`[CLI] Starting stress testing pipeline (Run ID: ${runId})`);
      console.log(`[CLI] Configuration:`, JSON.stringify(config, null, 2));
    }
    
    // Load balancer configuration
    const balancerConfig = await loadBalancerConfig(config.configPath);
    metadata.balancerConfigHash = calculateConfigHash(balancerConfig);
    
    // Save initial metadata
    await saveRunMetadata(metadata);
    
    let archetypes: StressTestArchetype[] = [];
    let analysis: MarginalUtilityAnalysis;
    let exportPaths: string[] = [];
    
    if (!config.exportOnly) {
      // Step 1: Generate archetypes
      archetypes = await generateArchetypes(balancerConfig, config);
      
      // Step 2: Run analysis
      analysis = await runAnalysis(archetypes, config);
      
      // Step 3: Export results
      exportPaths = await exportResults(analysis, config);
    } else {
      // Export only mode - just export existing telemetry
      if (config.enableTelemetry) {
        const telemetryData = exportStressTestTelemetry();
        const telemetryPath = `${config.outputPath}/telemetry-export-${runId}.json`;
        await saveData(telemetryPath, telemetryData);
        exportPaths.push(telemetryPath);
        
        if (config.enableLogging) {
          console.log(`[CLI] Exported existing telemetry to ${telemetryPath}`);
        }
      }
    }
    
    // Update metadata with results
    const duration = Date.now() - startTime;
    metadata.duration = duration;
    metadata.status = 'completed';
    metadata.results = {
      archetypesGenerated: archetypes.length,
      simulationsRun: analysis?.summary.totalSimulations || 0,
      analysesCompleted: analysis ? 1 : 0,
      exportPaths,
    };
    
    // Save final metadata
    await saveRunMetadata(metadata);
    
    // Log summary
    if (config.enableLogging) {
      console.log(`\n[CLI] ✅ Pipeline completed successfully!`);
      console.log(`[CLI] Duration: ${duration}ms`);
      console.log(`[CLI] Results: ${JSON.stringify(metadata.results, null, 2)}`);
      
      if (config.enableTelemetry) {
        const telemetrySummary = getStressTestTelemetrySummary();
        console.log(`[CLI] Telemetry Summary:`, telemetrySummary);
      }
    }
    
    // Output JSON summary for programmatic use
    console.log('\n=== PIPELINE SUMMARY ===');
    console.log(JSON.stringify({
      runId,
      status: 'completed',
      duration,
      results: metadata.results,
      timestamp: metadata.timestamp,
    }, null, 2));
    
  } catch (error) {
    // Handle failure
    const duration = Date.now() - startTime;
    metadata.duration = duration;
    metadata.status = 'failed';
    metadata.error = error instanceof Error ? error.message : String(error);
    
    await saveRunMetadata(metadata);
    
    console.error(`[CLI] ❌ Pipeline failed after ${duration}ms:`, error);
    
    // Exit with error code (but ensure cleanup first)
    process.exit(1);
  }
}

/**
 * CLI program setup
 */
const program = new Command();

program
  .name('stress-pipeline')
  .description('Stress Testing CLI Orchestrator for Phase 10.5')
  .version('1.0.0');

program
  .command('run')
  .description('Run the complete stress testing pipeline')
  .option('-i, --iterations <number>', 'Number of simulations per archetype pair', '10000')
  .option('-s, --seed <number>', 'Random seed for deterministic results', String(Date.now()))
  .option('-o, --output <path>', 'Output directory for exports', '/data/exports/stressTesting')
  .option('--export-only', 'Only export existing telemetry data', false)
  .option('--no-telemetry', 'Disable telemetry collection', false)
  .option('--no-logging', 'Disable console logging', false)
  .option('--config <path>', 'Path to custom balancer config file')
  .option('--ci-mode', 'Run in CI mode with reduced iterations and optimized output', false)
  .action(async (options) => {
    const config: Partial<CLIConfig> = {
      iterations: options.ciMode ? 200 : parseInt(options.iterations),
      seed: parseInt(options.seed),
      outputPath: options.output,
      exportOnly: options.exportOnly,
      enableTelemetry: options.telemetry !== false,
      enableLogging: options.ciMode ? false : options.logging !== false, // Reduce logging in CI
      configPath: options.config,
    };
    
    await runStressPipeline(config);
  });

program
  .command('status')
  .description('Show status of recent runs')
  .option('-l, --limit <number>', 'Number of recent runs to show', '5')
  .action(async (_options) => {
    // This would require implementing a status check function
    console.log('Status command not yet implemented');
  });

program
  .command('cleanup')
  .description('Clean up old run data and exports')
  .option('-d, --days <number>', 'Keep data newer than this many days', '7')
  .action(async (_options) => {
    // This would require implementing a cleanup function
    console.log('Cleanup command not yet implemented');
  });

// Parse CLI arguments
if (import.meta.url) {
  // ES module environment
  program.parse();
} else {
  // CommonJS environment
  program.parse();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[CLI] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CLI] Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[CLI] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[CLI] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});
