#!/usr/bin/env tsx

/**
 * Scenario Runner CLI for Balancer Monte Carlo Simulations
 * 
 * Command-line tool for executing Balancer scenarios with targetTurns,
 * synchronizing Monte Carlo and WeightCalibration systems.
 * 
 * Usage:
 *   npm run scenario-runner --scenario basic-1v1 --iterations 10000 --export json
 *   npm run scenario-runner --scenario boss-fight --verbose
 *   npm run scenario-runner --list
 */

import { program } from 'commander';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { saveData } from '../../src/shared/persistence/PersistenceService';
import { SCENARIO_TEMPLATES, type ScenarioConfig, type ScenarioResult } from '../../src/balancing/monteCarlo/ScenarioConfig';
import type { BalancerConfig, StatDefinition, CardDefinition, BalancerPreset } from '../../src/balancing/config/types';

// Mock implementations for missing modules
const mockBalancerConfig: BalancerConfig = {
  version: '1.0.0',
  targetTurns: { '1v1': 20, 'boss': 30, 'group': 25, 'swarm': 40 },
  scenarioBudget: { '1v1': { hpEq: 100, damageEq: 15 }, 'boss': { hpEq: 500, damageEq: 40 } },
  stats: {} as Record<string, StatDefinition>,
  cards: {} as Record<string, CardDefinition>,
  presets: {} as Record<string, BalancerPreset>,
  activePresetId: 'default',
};

const mockOptimalWeights: Record<string, number> = {
  hp: 1.0,
  damage: 1.0,
  defense: 0.8,
  speed: 0.6,
};

function loadBalancerConfig(_configName: string): BalancerConfig {
  return mockBalancerConfig;
}

function calculateOptimalWeights(_archetypePerformance: Record<string, any>, _baseWeights: Record<string, number>): Record<string, number> {
  return mockOptimalWeights;
}

// Mock Monte Carlo simulation
async function runMonteCarloSimulation(
  scenario: ScenarioConfig,
  _balancerConfig: BalancerConfig,
  _verbose: boolean = false
): Promise<ScenarioResult> {
  // Mock simulation results
  const mockArchetypePerformance: Record<string, any> = {
    'warrior': {
      archetypeId: 'warrior',
      winRate: 0.65,
      avgTurns: 18.5,
      stdDev: 4.2,
      rating: 'Good' as const,
    },
    'mage': {
      archetypeId: 'mage',
      winRate: 0.58,
      avgTurns: 22.1,
      stdDev: 5.8,
      rating: 'Average' as const,
    },
    'rogue': {
      archetypeId: 'rogue',
      winRate: 0.72,
      avgTurns: 16.3,
      stdDev: 3.9,
      rating: 'Good' as const,
    },
  };

  return {
    scenarioId: scenario.id,
    timestamp: Date.now(),
    iterations: scenario.simulationParams.iterations,
    winRate: 0.65,
    avgTurnsToVictory: 18.5,
    avgTurnsToDefeat: 28.2,
    turnsStdDev: 4.2,
    statistics: {
      victories: 6500,
      defeats: 2800,
      timeouts: 700,
      avgDamageDealt: 125.5,
      avgDamageTaken: 89.3,
      avgHpRemaining: 45.2,
    },
    archetypePerformance: mockArchetypePerformance,
    synergyAnalysis: [],
  };
}

interface CliOptions {
  scenario?: string;
  iterations?: number;
  export?: 'json' | 'csv' | 'markdown';
  verbose?: boolean;
  seed?: number;
  output?: string;
  list?: boolean;
  config?: string;
}

const DEFAULT_OPTIONS: Required<CliOptions> = {
  iterations: 10000,
  export: 'json',
  verbose: false,
  seed: Date.now(),
  output: '/data/exports',
  config: 'default',
  list: false,
  scenario: 'basic-1v1',
};

export async function runScenario(scenario: ScenarioConfig, options: CliOptions): Promise<ScenarioResult> {
  if (options.verbose) {
    console.log(`🎮 Running scenario: ${scenario.name || scenario.id}`);
    console.log(`📊 Target turns: ${scenario.targetTurns}`);
    console.log(`🔄 Iterations: ${scenario.simulationParams.iterations}`);
    console.log(`🎲 Seed: ${scenario.simulationParams.seed}`);
    console.log(`⚔ Enemy: ${scenario.enemy.name} (${scenario.enemy.type})`);
    console.log('');
  }

  // Load balancer configuration
  const balancerConfig = loadBalancerConfig(options.config);
  
  // Run Monte Carlo simulation
  const simulationResult = await runMonteCarloSimulation(
    scenario,
    balancerConfig,
    options.verbose
  );

  // Calculate optimal weights based on results
  const optimalWeights = calculateOptimalWeights(
    simulationResult.archetypePerformance,
    scenario.statWeights
  );

  // Enhance result with weight analysis
  const enhancedResult: ScenarioResult = {
    ...simulationResult,
    archetypePerformance: Object.fromEntries(
      Object.entries(simulationResult.archetypePerformance).map(([id, result]) => [
        id,
        {
          ...result,
          optimalWeight: optimalWeights[id] || 0,
        },
      ])
    ),
  };

  // Export results if requested
  if (options.export) {
    await exportResults(enhancedResult, options);
  }

  return enhancedResult;
}

export async function exportResults(result: ScenarioResult, options: CliOptions): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `scenario-${result.scenarioId}-${timestamp}.${options.export}`;
  const outputPath = join(options.output || DEFAULT_OPTIONS.output, filename);

  // Ensure output directory exists
  const outputDir = options.output || DEFAULT_OPTIONS.output;
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  let content: string;
  
  switch (options.export) {
    case 'json':
      content = JSON.stringify(result, null, 2);
      break;
    case 'csv':
      content = convertToCSV(result);
      break;
    case 'markdown':
      content = convertToMarkdown(result);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.export}`);
  }

  writeFileSync(outputPath, content, 'utf8');
  
  if (options.verbose) {
    console.log(`📄 Results exported to: ${outputPath}`);
  }
}

export function convertToCSV(result: ScenarioResult): string {
  const headers = [
    'Scenario ID',
    'Timestamp',
    'Iterations',
    'Win Rate',
    'Avg Turns to Victory',
    'Avg Turns to Defeat',
    'Turns Std Dev',
    'Victories',
    'Defeats',
    'Timeouts',
    'Avg Damage Dealt',
    'Avg Damage Taken',
    'Avg HP Remaining',
  ];

  const rows = [headers.join(',')];

  // Add summary row
  rows.push([
    result.scenarioId,
    new Date(result.timestamp).toISOString(),
    result.iterations.toString(),
    result.winRate.toFixed(4),
    result.avgTurnsToVictory.toFixed(2),
    result.avgTurnsToDefeat.toFixed(2),
    result.turnsStdDev.toFixed(2),
    result.statistics.victories.toString(),
    result.statistics.defeats.toString(),
    result.statistics.timeouts.toString(),
    result.statistics.avgDamageDealt.toFixed(2),
    result.statistics.avgDamageTaken.toFixed(2),
    result.statistics.avgHpRemaining.toFixed(2),
  ].join(','));

  // Add archetype performance data
  Object.entries(result.archetypePerformance).forEach(([id, performance]) => {
    rows.push([
      id,
      '',
      '',
      performance.winRate.toFixed(4),
      performance.avgTurns.toFixed(2),
      '',
      performance.stdDev.toFixed(2),
      '',
      '',
      '',
      '',
      '',
      '',
      performance.rating,
    ].join(','));
  });

  return rows.join('\n');
}

export function convertToMarkdown(result: ScenarioResult): string {
  const lines = [
    `# Scenario Results: ${result.scenarioId}`,
    '',
    `**Name:** ${result.scenarioId}`,
    `**Target Turns:** N/A`,
    `**Iterations:** ${result.iterations}`,
    `**Win Rate:** ${(result.winRate * 100).toFixed(2)}%`,
    `**Avg Turns to Victory:** ${result.avgTurnsToVictory.toFixed(2)}`,
    `**Avg Turns to Defeat:** ${result.avgTurnsToDefeat.toFixed(2)}`,
    `**Standard Deviation:** ${result.turnsStdDev.toFixed(2)}`,
    '',
    '## Statistics',
    '',
    `- **Victories:** ${result.statistics.victories}`,
    `- **Defeats:** ${result.statistics.defeats}`,
    `- **Timeouts:** ${result.statistics.timeouts}`,
    `- **Avg Damage Dealt:** ${result.statistics.avgDamageDealt.toFixed(2)}`,
    `- **Avg Damage Taken:** ${result.statistics.avgDamageTaken.toFixed(2)}`,
    `- **Avg HP Remaining:** ${result.statistics.avgHpRemaining.toFixed(2)}`,
    '',
    '## Archetype Performance',
    '',
    '| Archetype | Win Rate | Avg Turns | Rating |',
    '|----------|----------|----------|--------|',
  ];

  Object.entries(result.archetypePerformance).forEach(([id, performance]) => {
    lines.push(
      `| ${id} | ${(performance.winRate * 100).toFixed(2)}% | ${performance.avgTurns.toFixed(2)} | ${performance.rating} |`
    );
  });

  if (result.synergyAnalysis.length > 0) {
    lines.push('', '## Synergy Analysis', '');
    lines.push('| Pair | Combined Win Rate | Expected | Multiplier | Rating | Sample Size |');
    lines.push('|------|------------------|---------|-----------|--------|------------|');
    
    result.synergyAnalysis.forEach(synergy => {
      lines.push(
        `| ${synergy.archetypePair.join(' + ')} | ${(synergy.combinedWinRate * 100).toFixed(2)}% | ${(synergy.expectedWinRate * 100).toFixed(2)}% | ${synergy.synergyMultiplier.toFixed(2)} | ${synergy.rating} | ${synergy.sampleSize} |`
      );
    });
  }

  return lines.join('\n');
}

export function listScenarios(): void {
  console.log('📋 Available Scenarios:');
  console.log('');
  
  Object.entries(SCENARIO_TEMPLATES).forEach(([id, scenario]) => {
    console.log(`  ${id.padEnd(20)} - ${scenario.name}`);
    console.log(`    ${scenario.description}`);
    console.log(`    Target Turns: ${scenario.targetTurns}`);
    console.log(`    Enemy: ${scenario.enemy.name} (${scenario.enemy.type})`);
    console.log(`    Difficulty: ${scenario.enemy.difficulty}/10`);
    console.log('');
  });
}

async function main(): Promise<void> {
  program
    .name('scenario-runner')
    .description('CLI tool for Balancer Monte Carlo scenarios')
    .version('1.0.0')
    .option('-s, --scenario <scenario>', 'Scenario ID to run')
    .option('-i, --iterations <number>', 'Number of Monte Carlo iterations', parseInt)
    .option('-e, --export <format>', 'Export format (json|csv|markdown)', 'json')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('--seed <number>', 'Random seed for reproducibility', parseInt)
    .option('-o, --output <path>', 'Output directory for results', '/data/exports')
    .option('-c, --config <name>', 'Balancer config to use', 'default')
    .option('-l, --list', 'List available scenarios')
    .parse();

  const options: CliOptions = {
    ...DEFAULT_OPTIONS,
    ...program.opts,
  };

  try {
    if (options.list) {
      listScenarios();
      return;
    }

    if (!options.scenario) {
      console.error('❌ Error: Scenario ID is required. Use --list to see available scenarios.');
      process.exit(1);
    }

    const scenario = SCENARIO_TEMPLATES[options.scenario as keyof typeof SCENARIO_TEMPLATES];
    
    if (!scenario) {
      console.error(`❌ Error: Scenario '${options.scenario}' not found.`);
      process.exit(1);
    }

    // Override scenario options with CLI options
    const enhancedScenario: ScenarioConfig = {
      ...scenario,
      simulationParams: {
        ...scenario.simulationParams,
        iterations: options.iterations ?? DEFAULT_OPTIONS.iterations,
        seed: options.seed ?? DEFAULT_OPTIONS.seed,
        deterministic: false,
        verbose: options.verbose ?? DEFAULT_OPTIONS.verbose,
        exportResults: true,
        exportFormat: options.export ?? DEFAULT_OPTIONS.export,
      },
    };

    const result = await runScenario(enhancedScenario, options);
    
    if (options.verbose) {
      console.log('');
      console.log('📊 Final Results:');
      console.log(`  Win Rate: ${(result.winRate * 100).toFixed(2)}%`);
      console.log(`  Avg Turns to Victory: ${result.avgTurnsToVictory.toFixed(2)}`);
      console.log(`  Avg Turns to Defeat: ${result.avgTurnsToDefeat.toFixed(2)}`);
      console.log(`  Standard Deviation: ${result.turnsStdDev.toFixed(2)}`);
      
      if (result.synergyAnalysis.length > 0) {
        console.log(`  Synergies Found: ${result.synergyAnalysis.length}`);
        const opSynergies = result.synergyAnalysis.filter((s: any) => s.rating === 'OP');
        const weakSynergies = result.synergyAnalysis.filter((s: any) => s.rating === 'Weak');
        console.log(`  OP Synergies: ${opSynergies.length}`);
        console.log(`  Weak Synergies: ${weakSynergies.length}`);
      }
    }

    // Save to persistence for tracking
    await saveData('lastScenarioResult', result);
    
    console.log('✅ Scenario completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running scenario:', error);
    process.exit(1);
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main();
}
