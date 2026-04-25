/**
 * Crew Scheduler Stress CLI
 * Batch offline stress testing for crew scheduler
 * 
 * @see NP-154 – Idle Village Crew Scheduler Stress Harness
 * 
 * Usage:
 *   tsx scripts/idleVillage/crewSchedulerStress.ts
 *   tsx scripts/idleVillage/crewSchedulerStress.ts --runs 5000 --seed 123
 *   tsx scripts/idleVillage/crewSchedulerStress.ts --output json
 */

import { parseArgs } from 'node:util';
import { writeFileSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';
import {
  CrewSchedulerStressHarness,
  DEFAULT_STRESS_CONFIG,
  type StressTestConfig,
} from '../../src/ui/idleVillage/diagnostics/CrewSchedulerStressHarness';

// CLI argument parsing
const { values: args } = parseArgs({
  options: {
    runs: { type: 'string', short: 'r', default: '1000' },
    seed: { type: 'string', short: 's', default: '42' },
    output: { type: 'string', short: 'o', default: 'markdown' },
    file: { type: 'string', short: 'f' },
    crewMin: { type: 'string', default: '3' },
    crewMax: { type: 'string', default: '15' },
    verbose: { type: 'boolean', short: 'v' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: false,
});

// Show help
if (args.help) {
  console.log(`
Crew Scheduler Stress Test CLI

Usage:
  tsx scripts/idleVillage/crewSchedulerStress.ts [options]

Options:
  -r, --runs <number>        Number of test runs (default: 1000)
  -s, --seed <number>        Random seed for determinism (default: 42)
  -o, --output <format>      Output format: markdown, json (default: markdown)
  -f, --file <path>          Output file path
  --crewMin <number>         Minimum crew size (default: 3)
  --crewMax <number>         Maximum crew size (default: 15)
  -v, --verbose              Verbose output
  -h, --help                 Show this help message

Examples:
  # Run 1000 scenarios
  tsx scripts/idleVillage/crewSchedulerStress.ts

  # Run 5000 scenarios with custom seed
  tsx scripts/idleVillage/crewSchedulerStress.ts --runs 5000 --seed 123

  # JSON output
  tsx scripts/idleVillage/crewSchedulerStress.ts --output json

  # Custom crew size range
  tsx scripts/idleVillage/crewSchedulerStress.ts --crewMin 5 --crewMax 20
`);
  process.exit(0);
}

// Logging utilities
function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const prefix = {
    info: '[INFO]',
    warn: '[WARN]',
    error: '[ERROR]',
  }[level];
  console.error(`${prefix} ${message}`);
}

function verbose(message: string): void {
  if (args.verbose) {
    console.error(`[DEBUG] ${message}`);
  }
}

/**
 * Main CLI execution
 */
async function main(): Promise<void> {
  log('Crew Scheduler Stress Test CLI');
  log('================================');
  log('');

  // Parse configuration
  const runs = parseInt(args.runs || '1000');
  const seed = parseInt(args.seed || '42');
  const crewMin = parseInt(args.crewMin || '3');
  const crewMax = parseInt(args.crewMax || '15');

  verbose(`Runs: ${runs}`);
  verbose(`Seed: ${seed}`);
  verbose(`Crew size: ${crewMin}-${crewMax}`);

  // Build configuration
  const config: StressTestConfig = {
    ...DEFAULT_STRESS_CONFIG,
    runs,
    seed,
    crewCaps: {
      min: crewMin,
      max: crewMax,
    },
  };

  // Create harness
  const harness = new CrewSchedulerStressHarness(config);

  // Run stress test
  log('Running stress test...');
  const result = await harness.runStressTest();

  log(`Completed ${result.metrics.totalScenarios} scenarios`);
  log(`Conflicts detected: ${result.metrics.conflictsDetected} (${result.metrics.conflictPercentage.toFixed(2)}%)`);
  log(`Avg latency: ${result.metrics.avgLatencyMs.toFixed(2)}ms`);
  log('');

  // Format output
  const format = args.output || 'markdown';
  let output: string;
  let extension: string;

  if (format === 'json') {
    output = harness.exportToJSON(result);
    extension = 'json';
  } else {
    output = harness.exportToMarkdown(result);
    extension = 'md';
  }

  // Determine output file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const defaultFilename = `crew-stress-${timestamp}.${extension}`;
  const outputDir = path.join('data', 'exports', 'idleVillage', 'stress');
  const outputFile = args.file || path.join(outputDir, defaultFilename);

  // Ensure directory exists
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  // Write output
  try {
    writeFileSync(outputFile, output, 'utf-8');
    log(`Report written to: ${outputFile}`);
  } catch (error) {
    log(`Failed to write file: ${error}`, 'error');
    console.log(output);
  }

  // Print KPI summary
  log('');
  log('KPI Summary:');
  log(`  Conflict %: ${result.metrics.conflictPercentage.toFixed(2)}%`);
  log(`  Avg Latency: ${result.metrics.avgLatencyMs.toFixed(2)}ms`);
  log(`  Scenarios/sec: ${result.performance.scenariosPerSecond.toFixed(2)}`);
  log(`  Memory: ${result.performance.memoryUsageMB.toFixed(2)}MB`);
  log('');

  // Exit with error code if high conflict rate
  if (result.metrics.conflictPercentage > 30) {
    log('⚠️  High conflict rate detected!', 'error');
    process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
