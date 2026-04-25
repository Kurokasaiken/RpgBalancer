#!/usr/bin/env tsx

/**
 * Sensitivity Analysis CLI for Balancer Stat Weights
 * 
 * Command-line tool for running sensitivity analysis on balancer stat weights
 * using Monte Carlo simulations with weight perturbation.
 * 
 * Usage:
 *   npm run sensitivity-analysis --config basic --iterations 10000 --export json
 *   npm run sensitivity-analysis --scope single-stat --stat hp --verbose
 *   npm run sensitivity-analysis --list-configs
 * 
 * @since NP-189 – Balancer Stat Weight Sensitivity Analysis
 */

import { program } from 'commander';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { saveData } from '../../src/shared/persistence/PersistenceService';
import { runSensitivityAnalysis, exportResults, DEFAULT_SENSITIVITY_CONFIG } from '../../src/balancing/analysis/StatWeightSensitivity';
import type { SensitivityConfig, SensitivityAnalysisResult } from '../../src/balancing/analysis/StatWeightSensitivity';
import type { BalancerConfig, StatDefinition, CardDefinition, BalancerPreset } from '../../src/balancing/config/types';

// Mock balancer config for testing
const mockBalancerConfig: BalancerConfig = {
  version: '1.0.0',
  targetTurns: { '1v1': 20, 'boss': 30, 'group': 25, 'swarm': 40 },
  scenarioBudget: { '1v1': { hpEq: 100, damageEq: 15 }, 'boss': { hpEq: 500, damageEq: 40 } },
  stats: {} as Record<string, StatDefinition>,
  cards: {} as Record<string, CardDefinition>,
  presets: {} as Record<string, BalancerPreset>,
  activePresetId: 'default',
};

// Predefined configurations
const PREDEFINED_CONFIGS: Record<string, Partial<SensitivityConfig>> = {
  basic: {
    analysis: {
      scope: 'full-system',
      iterations: 1000,
      seed: 42,
      timeoutMinutes: 5,
      verbose: false,
    },
    perturbation: {
      ranges: [
        {
          id: 'small',
          percentage: 0.10,
          steps: 5,
          description: 'Small perturbations (±10%)',
        },
        {
          id: 'medium',
          percentage: 0.20,
          steps: 3,
          description: 'Medium perturbations (±20%)',
        },
      ],
      bidirectional: true,
      maxPerturbations: 10,
    },
    metrics: {
      primary: ['winRate', 'balanceScore'],
      weights: {
        winRate: 0.6,
        balanceScore: 0.4,
      },
    },
    scenario: {
      template: 'basic-1v1',
    },
  },
  quick: {
    analysis: {
      scope: 'single-stat',
      iterations: 500,
      seed: 42,
      timeoutMinutes: 2,
      verbose: false,
    },
    perturbation: {
      ranges: [
        {
          id: 'small',
          percentage: 0.05,
          steps: 3,
          description: 'Small perturbations (±5%)',
        },
      ],
      bidirectional: true,
      maxPerturbations: 6,
    },
    metrics: {
      primary: ['winRate'],
      weights: {
        winRate: 1.0,
      },
    },
    scenario: {
      template: 'basic-1v1',
    },
  },
  comprehensive: {
    analysis: {
      scope: 'full-system',
      iterations: 5000,
      seed: 42,
      timeoutMinutes: 15,
      verbose: true,
    },
    perturbation: {
      ranges: [
        {
          id: 'tiny',
          percentage: 0.02,
          steps: 3,
          description: 'Tiny perturbations (±2%)',
        },
        {
          id: 'small',
          percentage: 0.05,
          steps: 5,
          description: 'Small perturbations (±5%)',
        },
        {
          id: 'medium',
          percentage: 0.10,
          steps: 7,
          description: 'Medium perturbations (±10%)',
        },
        {
          id: 'large',
          percentage: 0.20,
          steps: 5,
          description: 'Large perturbations (±20%)',
        },
      ],
      bidirectional: true,
      maxPerturbations: 20,
    },
    metrics: {
      primary: ['winRate', 'balanceScore', 'averageTurns', 'damageOutput'],
      secondary: ['synergyScore', 'powerLevel', 'efficiency'],
      weights: {
        winRate: 0.3,
        balanceScore: 0.25,
        averageTurns: 0.2,
        damageOutput: 0.15,
        survivability: 0.1,
      },
    },
    scenario: {
      template: 'boss-fight',
    },
  },
  focused: {
    analysis: {
      scope: 'single-stat',
      iterations: 2000,
      seed: 42,
      timeoutMinutes: 3,
      verbose: false,
    },
    perturbation: {
      ranges: [
        {
          id: 'fine',
          percentage: 0.01,
          steps: 10,
          description: 'Fine-grained perturbations (±1%)',
        },
        {
          id: 'small',
          percentage: 0.05,
          steps: 5,
          description: 'Small perturbations (±5%)',
        },
      ],
      bidirectional: true,
      maxPerturbations: 15,
    },
    metrics: {
      primary: ['winRate', 'balanceScore'],
      weights: {
        winRate: 0.5,
        balanceScore: 0.5,
      },
    },
    scenario: {
      template: 'basic-1v1',
    },
  },
};

/**
 * Load balancer configuration
 */
function loadBalancerConfig(configName?: string): BalancerConfig {
  // In a real implementation, this would load from actual balancer config files
  console.log('Loading balancer configuration...');
  
  if (configName) {
    console.log(`Using config: ${configName}`);
  } else {
    console.log('Using default balancer configuration');
  }
  
  return mockBalancerConfig;
}

/**
 * Merge configurations
 */
function mergeConfigurations(
  predefinedName: string,
  customOptions: Partial<SensitivityConfig>
): Partial<SensitivityConfig> {
  const predefined = PREDEFINED_CONFIGS[predefinedName];
  
  if (!predefined) {
    console.error(`Unknown predefined config: ${predefinedName}`);
    console.log('Available configs:', Object.keys(PREDEFINED_CONFIGS).join(', '));
    process.exit(1);
  }
  
  // Deep merge configurations
  return {
    ...predefined,
    ...customOptions,
    analysis: {
      ...predefined.analysis,
      ...customOptions.analysis,
    },
    perturbation: {
      ...predefined.perturbation,
      ...customOptions.perturbation,
    },
    targetStats: {
      ...predefined.targetStats,
      ...customOptions.targetStats,
    },
    metrics: {
      ...predefined.metrics,
      ...customOptions.metrics,
    },
    scenario: {
      ...predefined.scenario,
      ...customOptions.scenario,
    },
    export: {
      ...predefined.export,
      ...customOptions.export,
    },
  };
}

/**
 * Save results to files
 */
async function saveResults(
  results: SensitivityAnalysisResult,
  formats: string[],
  outputDir: string
): Promise<void> {
  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = `sensitivity-analysis-${timestamp}`;
  
  for (const format of formats) {
    const filename = `${baseFilename}.${format}`;
    const filepath = join(outputDir, filename);
    
    try {
      const exported = exportResults(results, format as any);
      writeFileSync(filepath, exported, 'utf8');
      console.log(`✅ Saved ${format.toUpperCase()} results to: ${filepath}`);
    } catch (error) {
      console.error(`❌ Failed to save ${format} results:`, error);
    }
  }
  
  // Save to persistence service
  try {
    await saveData('sensitivity-analysis', results, {
      timestamp: results.metadata.startTime,
      analysisId: results.metadata.analysisId,
      config: results.config,
    });
    console.log('✅ Saved results to persistence service');
  } catch (error) {
    console.warn('⚠️  Failed to save to persistence service:', error);
  }
}

/**
 * Display analysis summary
 */
function displaySummary(results: SensitivityAnalysisResult, verbose: boolean = false): void {
  console.log('\n📊 Sensitivity Analysis Summary');
  console.log('================================');
  
  console.log(`🔍 Analysis ID: ${results.metadata.analysisId}`);
  console.log(`⏱️  Duration: ${(results.metadata.duration / 1000).toFixed(2)}s`);
  console.log(`🔄 Total Simulations: ${results.metadata.totalSimulations.toLocaleString()}`);
  console.log(`📈 Total Perturbations: ${results.metadata.totalPerturbations}`);
  console.log(`📋 Stats Analyzed: ${results.statResults.length}`);
  
  console.log('\n🎯 Key Findings:');
  console.log(`📈 Most Sensitive: ${results.summary.mostSensitive}`);
  console.log(`📉 Least Sensitive: ${results.summary.leastSensitive}`);
  console.log(`📊 Average Sensitivity: ${results.summary.averageSensitivity.toFixed(4)}`);
  
  if (results.summary.criticalStats.length > 0) {
    console.log(`🚨 Critical Stats: ${results.summary.criticalStats.join(', ')}`);
  }
  
  if (results.summary.insensitiveStats.length > 0) {
    console.log(`😌 Insensitive Stats: ${results.summary.insensitiveStats.join(', ')}`);
  }
  
  if (verbose) {
    console.log('\n📋 Detailed Results:');
    console.log('==================');
    
    // Sort by sensitivity
    const sortedResults = [...results.statResults].sort((a, b) => b.overallSensitivity - a.overallSensitivity);
    
    for (const result of sortedResults) {
      const sensitivityIcon = getSensitivityIcon(result.classification);
      console.log(`${sensitivityIcon} ${result.statName}: ${result.overallSensitivity.toFixed(4)} (${result.classification})`);
      console.log(`   💡 ${result.recommendation}`);
      
      if (result.perturbations.length > 0) {
        const maxPerturbation = result.perturbations.reduce((max, p) => 
          Math.abs(p.sensitivityScore) > Math.abs(max.sensitivityScore) ? p : max
        );
        console.log(`   📊 Max Impact: ${maxPerturbation.perturbation.toFixed(1)}% → ${maxPerturbation.sensitivityScore.toFixed(4)}`);
      }
      console.log('');
    }
  }
}

/**
 * Get sensitivity icon based on classification
 */
function getSensitivityIcon(classification: string): string {
  switch (classification) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'moderate': return '📊';
    case 'low': return '📉';
    case 'insensitive': return '😌';
    default: return '❓';
  }
}

/**
 * List available configurations
 */
function listConfigurations(): void {
  console.log('📋 Available Configurations:');
  console.log('============================');
  
  for (const [name, config] of Object.entries(PREDEFINED_CONFIGS)) {
    console.log(`\n🔧 ${name}:`);
    console.log(`   Scope: ${config.analysis?.scope || 'full-system'}`);
    console.log(`   Iterations: ${config.analysis?.iterations || 1000}`);
    console.log(`   Timeout: ${config.analysis?.timeoutMinutes || 5}min`);
    console.log(`   Perturbations: ${config.perturbation?.maxPerturbations || 10}`);
    console.log(`   Scenario: ${config.scenario?.template || 'basic-1v1'}`);
  }
}

/**
 * Validate configuration
 */
function validateConfig(config: Partial<SensitivityConfig>): void {
  if (config.analysis?.iterations && config.analysis.iterations > 10000) {
    console.warn('⚠️  High iteration count may take a long time to complete');
  }
  
  if (config.analysis?.timeoutMinutes && config.analysis.timeoutMinutes > 30) {
    console.warn('⚠️  Long timeout may impact system performance');
  }
  
  if (config.perturbation?.maxPerturbations && config.perturbation.maxPerturbations > 50) {
    console.warn('⚠️  High perturbation count may generate excessive data');
  }
  
  if (config.export?.formats && config.export.formats.length === 0) {
    console.warn('⚠️  No export formats specified');
  }
}

// CLI setup
program
  .name('sensitivity-analysis')
  .description('CLI tool for balancer stat weight sensitivity analysis')
  .version('1.0.0');

program
  .command('run')
  .description('Run sensitivity analysis')
  .option('-c, --config <name>', 'Predefined configuration (basic, quick, comprehensive, focused)', 'basic')
  .option('-i, --iterations <number>', 'Number of Monte Carlo iterations', '1000')
  .option('-s, --scope <scope>', 'Analysis scope (single-stat, pairwise, full-system, custom)')
  .option('--stat <ids>', 'Target stat IDs (comma-separated)', '')
  .option('--seed <number>', 'Random seed for reproducible results', '42')
  .option('-t, --timeout <minutes>', 'Analysis timeout in minutes', '5')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--export <formats>', 'Export formats (json,csv,markdown)', 'json')
  .option('-o, --output <dir>', 'Output directory', './sensitivity-results')
  .option('--balancer-config <name>', 'Balancer configuration name')
  .option('--scenario <template>', 'Scenario template (basic-1v1, boss-fight, group-combat, swarm-horde)')
  .action(async (options) => {
    try {
      console.log('🚀 Starting Sensitivity Analysis...');
      console.log('=====================================');
      
      // Parse options
      const iterations = parseInt(options.iterations);
      const seed = parseInt(options.seed);
      const timeout = parseInt(options.timeout);
      const formats = options.export.split(',').map((f: string) => f.trim());
      
      // Build configuration
      const customConfig: Partial<SensitivityConfig> = {
        analysis: {
          iterations,
          seed,
          timeoutMinutes: timeout,
          verbose: options.verbose,
        },
        export: {
          formats,
          outputDir: options.output,
        },
      };
      
      if (options.scope) {
        customConfig.analysis!.scope = options.scope as any;
      }
      
      if (options.stat) {
        customConfig.targetStats = {
          statIds: options.stat.split(',').map((s: string) => s.trim()),
        };
      }
      
      if (options.scenario) {
        customConfig.scenario = {
          template: options.scenario as any,
        };
      }
      
      // Merge configurations
      const config = mergeConfigurations(options.config, customConfig);
      
      // Validate configuration
      validateConfig(config);
      
      console.log(`📋 Using configuration: ${options.config}`);
      console.log(`🔄 Iterations: ${iterations}`);
      console.log(`⏱️  Timeout: ${timeout}min`);
      console.log(`📁 Output: ${options.output}`);
      
      // Load balancer config
      const balancerConfig = loadBalancerConfig(options.balancerConfig);
      
      // Run analysis
      console.log('\n🔬 Running sensitivity analysis...');
      const startTime = Date.now();
      
      const results = await runSensitivityAnalysis(config, balancerConfig);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Analysis completed in ${(duration / 1000).toFixed(2)}s`);
      
      // Display summary
      displaySummary(results, options.verbose);
      
      // Save results
      console.log('\n💾 Saving results...');
      await saveResults(results, formats, options.output);
      
      console.log('\n🎉 Sensitivity analysis completed successfully!');
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  });

program
  .command('list-configs')
  .description('List available predefined configurations')
  .action(() => {
    listConfigurations();
  });

program
  .command('list-stats')
  .description('List available stats for analysis')
  .action(() => {
    console.log('📋 Available Stats:');
    console.log('==================');
    
    // In a real implementation, this would query the balancer config
    const mockStats = [
      { id: 'hp', name: 'Health Points', weight: 1.0 },
      { id: 'damage', name: 'Damage', weight: 1.0 },
      { id: 'defense', name: 'Defense', weight: 0.8 },
      { id: 'speed', name: 'Speed', weight: 0.6 },
      { id: 'accuracy', name: 'Accuracy', weight: 0.7 },
    ];
    
    for (const stat of mockStats) {
      console.log(`📊 ${stat.id}: ${stat.name} (weight: ${stat.weight})`);
    }
  });

program
  .command('validate')
  .description('Validate configuration without running analysis')
  .option('-c, --config <name>', 'Predefined configuration', 'basic')
  .option('-i, --iterations <number>', 'Number of iterations', '1000')
  .option('-s, --scope <scope>', 'Analysis scope')
  .option('-t, --timeout <minutes>', 'Timeout in minutes', '5')
  .action((options) => {
    try {
      console.log('🔍 Validating Configuration...');
      console.log('==============================');
      
      const iterations = parseInt(options.iterations);
      const timeout = parseInt(options.timeout);
      
      const customConfig: Partial<SensitivityConfig> = {
        analysis: {
          iterations,
          timeoutMinutes: timeout,
        },
      };
      
      if (options.scope) {
        customConfig.analysis!.scope = options.scope as any;
      }
      
      const config = mergeConfigurations(options.config, customConfig);
      
      validateConfig(config);
      
      console.log('✅ Configuration is valid!');
      console.log(`📋 Config: ${options.config}`);
      console.log(`🔄 Iterations: ${iterations}`);
      console.log(`⏱️  Timeout: ${timeout}min`);
      
    } catch (error) {
      console.error('❌ Configuration validation failed:', error);
      process.exit(1);
    }
  });

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
