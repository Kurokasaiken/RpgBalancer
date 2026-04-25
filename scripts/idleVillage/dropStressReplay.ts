#!/usr/bin/env node

/**
 * Drop Stress Replay CLI for Idle Village Phase E validation testing.
 * 
 * This CLI tool provides command-line access to the drop stress replay
 * functionality, allowing users to run thousands of scenarios and compare
 * results with expected outcomes.
 */

import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createDropStressReplayService, type ReplayConfig } from '../../src/ui/idleVillage/tools/DropStressReplayServiceImpl';
import type { DropStressDataset } from '../../src/ui/idleVillage/tools/DropStressReplayService';

const program = new Command();

/**
 * CLI configuration interface
 */
interface CLIOptions {
  dataset: string;
  concurrency?: number;
  failFast?: boolean;
  timeout?: number;
  verbose?: boolean;
  output?: string;
  format?: 'json' | 'markdown';
}

/**
 * Parse dataset file
 */
function parseDataset(filePath: string): DropStressDataset {
  if (!existsSync(filePath)) {
    throw new Error(`Dataset file not found: ${filePath}`);
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Basic validation
    if (!data.metadata || !data.scenarios || !Array.isArray(data.scenarios)) {
      throw new Error('Invalid dataset structure');
    }
    
    return data as DropStressDataset;
  } catch (error) {
    throw new Error(`Failed to parse dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save results to file
 */
function saveResults(results: any, filePath: string, format: 'json' | 'markdown'): void {
  const content = format === 'json' 
    ? JSON.stringify(results, null, 2)
    : generateMarkdownReport(results);

  writeFileSync(filePath, content, 'utf-8');
  console.log(`Results saved to: ${filePath}`);
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(results: any): string {
  const { 
    totalScenarios, 
    successfulReplays, 
    failedReplays, 
    matchingResults, 
    mismatchingResults, 
    accuracyRate,
    avgExecutionTimeMs,
    maxExecutionTimeMs,
    minExecutionTimeMs,
    performanceKPIs 
  } = results;

  return `# Drop Stress Replay Results

## Summary
- **Total Scenarios**: ${totalScenarios}
- **Successful Replays**: ${successfulReplays}
- **Failed Replays**: ${failedReplays}
- **Matching Results**: ${matchingResults}
- **Mismatching Results**: ${mismatchingResults}
- **Accuracy Rate**: ${(accuracyRate * 100).toFixed(2)}%

## Performance Metrics
- **Average Execution Time**: ${avgExecutionTimeMs.toFixed(2)}ms
- **Maximum Execution Time**: ${maxExecutionTimeMs.toFixed(2)}ms
- **Minimum Execution Time**: ${minExecutionTimeMs.toFixed(2)}ms
- **Total Time**: ${performanceKPIs.totalTimeMs.toFixed(2)}ms
- **Scenarios Per Second**: ${performanceKPIs.scenariosPerSecond.toFixed(2)}
- **Memory Usage**: ${performanceKPIs.memoryUsageMB.toFixed(2)}MB

## Failed Scenarios
${results.scenarioResults
  .filter((r: any) => !r.success)
  .map((r: any) => `- ${r.scenarioId}: ${r.error}`)
  .join('\n') || 'None'}

## Mismatching Scenarios
${results.scenarioResults
  .filter((r: any) => r.success && !r.matches)
  .map((r: any) => `- ${r.scenarioId}: Expected ${r.expectedResult.valid}, Got ${r.actualResult?.valid}`)
  .join('\n') || 'None'}
`;
}

/**
 * Main replay command
 */
program
  .name('drop-stress-replay')
  .description('CLI tool for stress testing Idle Village drop validation')
  .version('1.0.0');

program
  .command('replay')
  .description('Run stress replay on a dataset')
  .requiredOption('-d, --dataset <path>', 'Path to dataset file')
  .option('-c, --concurrency <number>', 'Maximum concurrent scenarios', '10')
  .option('-f, --fail-fast', 'Stop on first error')
  .option('-t, --timeout <number>', 'Timeout per scenario (ms)', '5000')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-o, --output <path>', 'Output file for results')
  .option('--format <format>', 'Output format (json|markdown)', 'json')
  .action(async (options: CLIOptions) => {
    try {
      console.log('🚀 Starting Drop Stress Replay...');
      
      // Parse dataset
      console.log(`📁 Loading dataset: ${options.dataset}`);
      const dataset = parseDataset(options.dataset);
      console.log(`✅ Loaded ${dataset.scenarios.length} scenarios`);

      // Create replay service
      const config: ReplayConfig = {
        concurrency: parseInt(options.concurrency?.toString() || '10'),
        failFast: options.failFast || false,
        timeoutMs: parseInt(options.timeout?.toString() || '5000'),
        verbose: options.verbose || false,
      };

      const service = createDropStressReplayService(config);
      
      if (options.verbose) {
        console.log(`⚙️  Configuration:`, config);
      }

      // Run replay
      console.log('🔄 Running stress replay...');
      const startTime = Date.now();
      const results = await service.replayDataset(dataset);
      const endTime = Date.now();

      console.log(`✅ Completed in ${endTime - startTime}ms`);
      console.log(`📊 Accuracy: ${(results.accuracyRate * 100).toFixed(2)}%`);
      console.log(`⚡ Performance: ${results.performanceKPIs.scenariosPerSecond.toFixed(2)} scenarios/sec`);

      // Display summary
      console.log('\n📈 Summary:');
      console.log(`   Total: ${results.totalScenarios}`);
      console.log(`   Success: ${results.successfulReplays}`);
      console.log(`   Failed: ${results.failedReplays}`);
      console.log(`   Matching: ${results.matchingResults}`);
      console.log(`   Mismatching: ${results.mismatchingResults}`);

      // Save results if output specified
      if (options.output) {
        const format = options.format || 'json';
        saveResults(results, options.output, format);
      }

      // Exit with error code if there were failures
      if (results.failedReplays > 0 || results.mismatchingResults > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate a dataset file')
  .requiredOption('-d, --dataset <path>', 'Path to dataset file')
  .action(async (options: { dataset: string }) => {
    try {
      console.log(`🔍 Validating dataset: ${options.dataset}`);
      const dataset = parseDataset(options.dataset);
      console.log(`✅ Dataset is valid`);
      console.log(`📊 ${dataset.scenarios.length} scenarios found`);
      console.log(`📝 Version: ${dataset.metadata.version}`);
      console.log(`🏷️  Tags: ${dataset.metadata.tags.join(', ')}`);
    } catch (error) {
      console.error('❌ Validation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program
  .command('generate-sample')
  .description('Generate a sample dataset for testing')
  .option('-o, --output <path>', 'Output file path', 'sample-drop-stress-dataset.json')
  .option('-n, --scenarios <number>', 'Number of scenarios to generate', '10')
  .action(async (options: { output: string; scenarios: string }) => {
    try {
      const scenarioCount = parseInt(options.scenarios);
      console.log(`📝 Generating ${scenarioCount} sample scenarios...`);

      const sampleDataset = generateSampleDataset(scenarioCount);
      
      saveResults(sampleDataset, options.output, 'json');
      console.log(`✅ Sample dataset generated: ${options.output}`);
    } catch (error) {
      console.error('❌ Generation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

/**
 * Generate sample dataset for testing
 */
function generateSampleDataset(scenarioCount: number): DropStressDataset {
  const scenarios = Array.from({ length: scenarioCount }, (_, i) => ({
    id: `scenario-${i + 1}`,
    seed: i,
    residentStats: {
      id: `resident-${i + 1}`,
      name: `Resident ${i + 1}`,
      level: Math.floor(Math.random() * 10) + 1,
      stats: {
        strength: Math.floor(Math.random() * 100),
        agility: Math.floor(Math.random() * 100),
        intelligence: Math.floor(Math.random() * 100),
      },
      fatigue: Math.random() * 100,
      tags: ['worker', 'resident'],
    },
    slotInfo: {
      id: `slot-${i + 1}`,
      type: (i % 2 === 0 ? 'activity' : 'location') as 'activity' | 'location',
      name: `Slot ${i + 1}`,
      capacity: Math.floor(Math.random() * 5) + 1,
      currentOccupants: Math.floor(Math.random() * 3),
      requirements: {
        minLevel: 1,
        maxFatigue: 80,
      },
    },
    expectedVerdict: {
      valid: Math.random() > 0.3,
      reason: 'Sample validation reason',
      confidence: Math.random(),
      ruleViolations: [],
    },
    metadata: {
      category: 'sample',
      difficulty: ['easy', 'medium', 'hard', 'extreme'][Math.floor(Math.random() * 4)] as any,
      description: `Sample scenario ${i + 1}`,
      tags: ['sample', 'test'],
      created: new Date().toISOString(),
    },
  }));

  return {
    metadata: {
      name: 'Sample Drop Stress Dataset',
      version: '1.0.0',
      description: 'Sample dataset for drop stress testing',
      totalScenarios: scenarioCount,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: ['sample', 'test'],
    },
    scenarios,
    benchmarks: {
      maxLatencyMs: 100,
      minAccuracyRate: 0.95,
      maxMemoryUsageMB: 50,
    },
  };
}

// Parse command line arguments
program.parse();

// Export for testing
export { program, parseDataset, saveResults, generateSampleDataset };
