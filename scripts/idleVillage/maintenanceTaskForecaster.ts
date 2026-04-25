#!/usr/bin/env node

/**
 * Idle Village Maintenance Task Forecaster CLI
 *
 * Command-line interface for forecasting maintenance tasks in Idle Village,
 * providing scheduling recommendations and actionable insights for optimal village management.
 *
 * @module maintenanceTaskForecasterCli
 * @since 2026-01-13
 * @author Cascade
 */

import { Command } from 'commander';
import {
  MaintenanceTaskForecaster,
  DEFAULT_MAINTENANCE_FORECAST_CONFIG,
  type MaintenanceForecastConfig,
  type MaintenanceTaskForecast,
  type MaintenanceTaskPriority,
  type MaintenanceTaskCategory,
} from '@/analytics/idleVillageMaintenanceTaskForecaster';
import { loadIdleVillageConfig } from '@/balancing/config/idleVillage/configLoader';
import { PersistenceService } from '@/shared/persistence/PersistenceService';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const program = new Command();

program
  .name('maintenance-forecast')
  .description('Forecast maintenance tasks for Idle Village')
  .version('1.0.0');

// Shared diagnostics instance
const diagnostics = createSandboxDiagnostics('MaintenanceTaskForecasterCLI', 'maintenance_forecast_cli');

/**
 * Load village state from file or create default
 */
async function loadVillageState(stateFile?: string): Promise<VillageState> {
  if (stateFile) {
    if (!existsSync(stateFile)) {
      throw new Error(`Village state file not found: ${stateFile}`);
    }
    const stateData = readFileSync(stateFile, 'utf-8');
    try {
      return JSON.parse(stateData);
    } catch (error) {
      throw new Error(`Invalid village state JSON: ${error}`);
    }
  }

  // Load from persistence if available
  try {
    const saved = await PersistenceService.load('idle_village_state');
    if (saved) {
      return saved as VillageState;
    }
  } catch (error) {
    diagnostics.warn('Could not load saved village state, using defaults', { error });
  }

  // Create minimal default state
  return {
    resources: { food: 100, wood: 50, stone: 25 },
    residents: {},
    buildings: {},
    activities: {},
    timestamp: Date.now(),
  };
}

/**
 * Load or create forecaster configuration
 */
function loadForecasterConfig(configFile?: string): Partial<MaintenanceForecastConfig> {
  if (configFile) {
    if (!existsSync(configFile)) {
      throw new Error(`Config file not found: ${configFile}`);
    }
    const configData = readFileSync(configFile, 'utf-8');
    try {
      return JSON.parse(configData);
    } catch (error) {
      throw new Error(`Invalid config JSON: ${error}`);
    }
  }

  return {};
}

/**
 * Create and configure forecaster
 */
async function createForecaster(
  configFile?: string,
  options: {
    horizonHours?: number;
    minConfidence?: number;
    maxConcurrent?: Record<string, number>;
  } = {}
): Promise<MaintenanceTaskForecaster> {
  const villageConfig = await loadIdleVillageConfig();
  const forecastConfig = loadForecasterConfig(configFile);

  // Apply CLI overrides
  if (options.horizonHours) {
    forecastConfig.forecastHorizonHours = options.horizonHours;
  }
  if (options.minConfidence !== undefined) {
    forecastConfig.minConfidenceThreshold = options.minConfidence;
  }
  if (options.maxConcurrent) {
    forecastConfig.maxConcurrentTasksPerCategory = {
      ...DEFAULT_MAINTENANCE_FORECAST_CONFIG.maxConcurrentTasksPerCategory,
      ...options.maxConcurrent,
    };
  }

  return new MaintenanceTaskForecaster(villageConfig, forecastConfig);
}

/**
 * Format forecast results for display
 */
function formatForecastSummary(forecast: MaintenanceTaskForecast): string {
  const lines: string[] = [];

  lines.push(`🏠 Idle Village Maintenance Task Forecast`);
  lines.push(`Generated: ${new Date(forecast.generatedAt).toLocaleString()}`);
  lines.push(`Horizon: ${forecast.horizonHours} hours`);
  lines.push('');

  // Summary metrics
  lines.push('📊 Summary:');
  lines.push(`  Total Tasks: ${forecast.metadata.totalTasksGenerated}`);
  lines.push(`  Filtered Tasks: ${forecast.metadata.tasksFilteredByConfidence + forecast.metadata.tasksFilteredByConcurrency}`);
  lines.push(`  Final Tasks: ${forecast.tasks.length}`);
  lines.push(`  Average Confidence: ${(forecast.metadata.averageConfidence * 100).toFixed(1)}%`);
  lines.push(`  Forecast Quality: ${(forecast.metadata.forecastQualityScore * 100).toFixed(1)}%`);
  lines.push('');

  // Tasks by priority
  lines.push('🎯 Tasks by Priority:');
  Object.entries(forecast.tasksByPriority).forEach(([priority, tasks]) => {
    if (tasks.length > 0) {
      const emoji = priority === 'critical' ? '🔴' : priority === 'high' ? '🟡' : priority === 'medium' ? '🟢' : '🔵';
      lines.push(`  ${emoji} ${priority.toUpperCase()}: ${tasks.length} tasks`);
    }
  });
  lines.push('');

  // Tasks by category
  lines.push('🔧 Tasks by Category:');
  Object.entries(forecast.tasksByCategory).forEach(([category, tasks]) => {
    if (tasks.length > 0) {
      lines.push(`  ${category.replace('_', ' ').toUpperCase()}: ${tasks.length} tasks`);
    }
  });
  lines.push('');

  // Alerts
  if (forecast.alerts.length > 0) {
    lines.push('🚨 Alerts:');
    forecast.alerts.forEach((alert, index) => {
      const emoji = alert.type === 'error' ? '❌' : '⚠️';
      lines.push(`  ${emoji} ${alert.message}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format detailed task list
 */
function formatTaskList(forecast: MaintenanceTaskForecast, options: {
  priority?: MaintenanceTaskPriority;
  category?: MaintenanceTaskCategory;
  limit?: number;
} = {}): string {
  const lines: string[] = [];

  let tasks = forecast.tasks;

  // Apply filters
  if (options.priority) {
    tasks = tasks.filter(task => task.priority === options.priority);
  }
  if (options.category) {
    tasks = tasks.filter(task => task.category === options.category);
  }

  // Apply limit
  if (options.limit) {
    tasks = tasks.slice(0, options.limit);
  }

  lines.push(`📋 Maintenance Tasks (${tasks.length})`);
  if (options.priority) lines.push(`Priority: ${options.priority.toUpperCase()}`);
  if (options.category) lines.push(`Category: ${options.category.replace('_', ' ').toUpperCase()}`);
  if (options.limit) lines.push(`Limited to: ${options.limit} tasks`);
  lines.push('');

  if (tasks.length === 0) {
    lines.push('No tasks match the specified criteria.');
    return lines.join('\n');
  }

  tasks.forEach((task, index) => {
    const priorityEmoji = task.priority === 'critical' ? '🔴' : task.priority === 'high' ? '🟡' : task.priority === 'medium' ? '🟢' : '🔵';
    const hoursUntilDeadline = Math.max(0, (task.targetCompletionTime - Date.now()) / 3600000);

    lines.push(`${index + 1}. ${priorityEmoji} ${task.name}`);
    lines.push(`   Category: ${task.category.replace('_', ' ')}`);
    lines.push(`   Priority: ${task.priority.toUpperCase()}`);
    lines.push(`   Duration: ${task.estimatedDuration} minutes`);
    lines.push(`   Deadline: ${hoursUntilDeadline.toFixed(1)} hours`);
    lines.push(`   Confidence: ${(task.confidence * 100).toFixed(1)}%`);
    lines.push(`   Description: ${task.description}`);

    if (task.reasoning && task.reasoning.length > 0) {
      lines.push(`   Reasoning:`);
      task.reasoning.forEach(reason => {
        lines.push(`     • ${reason}`);
      });
    }

    if (Object.keys(task.requiredResources).length > 0) {
      lines.push(`   Required Resources: ${Object.entries(task.requiredResources)
        .map(([res, amt]) => `${res}(${amt})`)
        .join(', ')}`);
    }

    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Format scheduling recommendations
 */
function formatSchedulingRecommendations(forecast: MaintenanceTaskForecast, limit?: number): string {
  const lines: string[] = [];

  const recommendations = forecast.schedulingRecommendations.slice(0, limit || 10);

  lines.push(`📅 Scheduling Recommendations (${recommendations.length})`);
  lines.push('');

  if (recommendations.length === 0) {
    lines.push('No scheduling recommendations available.');
    return lines.join('\n');
  }

  recommendations.forEach((rec, index) => {
    const task = rec.task;
    const window = rec.schedulingWindow;
    const startTime = new Date(window.startTime).toLocaleString();
    const endTime = new Date(window.endTime).toLocaleString();

    lines.push(`${index + 1}. ${task.name}`);
    lines.push(`   Recommended Time: ${startTime} - ${endTime}`);
    lines.push(`   Duration: ${Math.round(window.duration / 60000)} minutes`);

    if (rec.conflicts.length > 0) {
      lines.push(`   ⚠️ Conflicts: ${rec.conflicts.length}`);
      rec.conflicts.slice(0, 2).forEach(conflict => {
        lines.push(`     • ${conflict}`);
      });
    }

    lines.push(`   Expected Impact:`);
    lines.push(`     • Efficiency Gain: ${(rec.impact.efficiencyGain * 100).toFixed(1)}%`);
    lines.push(`     • Risk Reduction: ${(rec.impact.riskReduction * 100).toFixed(1)}%`);

    if (rec.alternatives && rec.alternatives.length > 0) {
      lines.push(`   Alternative Times:`);
      rec.alternatives.slice(0, 2).forEach((alt, altIndex) => {
        const altStart = new Date(alt.startTime).toLocaleString();
        lines.push(`     ${altIndex + 1}. ${altStart} (Score: ${(alt.score * 100).toFixed(0)}%)`);
      });
    }

    lines.push('');
  });

  return lines.join('\n');
}

// Forecast command
program
  .command('forecast')
  .description('Generate maintenance task forecast')
  .option('-s, --state <file>', 'Village state JSON file')
  .option('-c, --config <file>', 'Forecaster config JSON file')
  .option('-o, --output <file>', 'Save forecast to JSON file')
  .option('-r, --report <file>', 'Generate text report')
  .option('--horizon <hours>', 'Forecast horizon in hours', DEFAULT_MAINTENANCE_FORECAST_CONFIG.forecastHorizonHours.toString())
  .option('--min-confidence <value>', 'Minimum confidence threshold (0-1)', DEFAULT_MAINTENANCE_FORECAST_CONFIG.minConfidenceThreshold.toString())
  .option('--format <type>', 'Output format (summary|tasks|scheduling)', 'summary')
  .option('--priority <level>', 'Filter by priority (low|medium|high|critical)')
  .option('--category <type>', 'Filter by category')
  .option('--limit <number>', 'Limit results')
  .option('-v, --verbose', 'Show detailed output')
  .option('-q, --quiet', 'Suppress console output')
  .action(async (options: any) => {
    try {
      diagnostics.info('Starting maintenance task forecast', { options });

      // Create forecaster
      const forecaster = await createForecaster(options.config, {
        horizonHours: parseInt(options.horizon),
        minConfidence: parseFloat(options.minConfidence),
      });

      // Load village state
      const villageState = await loadVillageState(options.state);

      // Generate forecast
      const forecast = forecaster.generateForecast(villageState);

      // Output based on format
      let output = '';
      switch (options.format) {
        case 'summary':
          output = formatForecastSummary(forecast);
          break;
        case 'tasks':
          output = formatTaskList(forecast, {
            priority: options.priority,
            category: options.category,
            limit: options.limit ? parseInt(options.limit) : undefined,
          });
          break;
        case 'scheduling':
          output = formatSchedulingRecommendations(forecast, options.limit ? parseInt(options.limit) : undefined);
          break;
        default:
          output = formatForecastSummary(forecast);
      }

      if (!options.quiet) {
        console.log(output);
      }

      // Save forecast data
      if (options.output) {
        writeFileSync(options.output, JSON.stringify(forecast, null, 2));
        console.log(`💾 Forecast saved to: ${options.output}`);
      }

      // Generate report
      if (options.report) {
        writeFileSync(options.report, output);
        console.log(`📄 Report saved to: ${options.report}`);
      }

      // Emit telemetry
      diagnostics.info('Maintenance task forecast completed', {
        tasksGenerated: forecast.tasks.length,
        alerts: forecast.alerts.length,
        qualityScore: forecast.metadata.forecastQualityScore,
      });

      // Exit with status based on critical alerts
      const criticalAlerts = forecast.alerts.filter(a => a.type === 'error').length;
      process.exit(criticalAlerts > 0 ? 1 : 0);

    } catch (error) {
      diagnostics.error('Forecast failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('❌ Forecast failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Analyze command
program
  .command('analyze')
  .description('Analyze specific maintenance task or category')
  .argument('<taskId>', 'Task ID to analyze')
  .option('-s, --state <file>', 'Village state JSON file')
  .option('-c, --config <file>', 'Forecaster config JSON file')
  .option('-o, --output <file>', 'Save analysis to JSON file')
  .option('-v, --verbose', 'Show detailed analysis')
  .action(async (taskId: string, options: any) => {
    try {
      // Create forecaster
      const forecaster = await createForecaster(options.config);

      // Load village state
      const villageState = await loadVillageState(options.state);

      // Generate forecast
      const forecast = forecaster.generateForecast(villageState);

      // Find specific task
      const task = forecast.tasks.find(t => t.id === taskId);
      if (!task) {
        console.error(`❌ Task not found: ${taskId}`);
        console.log('Available tasks:');
        forecast.tasks.slice(0, 10).forEach(t => {
          console.log(`  ${t.id}: ${t.name}`);
        });
        process.exit(1);
      }

      // Find scheduling recommendation
      const recommendation = forecast.schedulingRecommendations.find(r => r.task.id === taskId);

      // Display analysis
      console.log(`🔍 Task Analysis: ${task.name}`);
      console.log(`ID: ${task.id}`);
      console.log(`Category: ${task.category.replace('_', ' ')}`);
      console.log(`Priority: ${task.priority.toUpperCase()}`);
      console.log(`Status: ${task.status}`);
      console.log(`Confidence: ${(task.confidence * 100).toFixed(1)}%`);
      console.log(`Estimated Duration: ${task.estimatedDuration} minutes`);
      console.log(`Target Completion: ${new Date(task.targetCompletionTime).toLocaleString()}`);
      console.log('');

      console.log('Description:');
      console.log(task.description);
      console.log('');

      if (task.reasoning && task.reasoning.length > 0) {
        console.log('Reasoning:');
        task.reasoning.forEach(reason => {
          console.log(`  • ${reason}`);
        });
        console.log('');
      }

      if (Object.keys(task.requiredResources).length > 0) {
        console.log('Required Resources:');
        Object.entries(task.requiredResources).forEach(([resource, amount]) => {
          console.log(`  • ${resource}: ${amount}`);
        });
        console.log('');
      }

      if (task.requiredSkills.length > 0) {
        console.log('Required Skills:');
        console.log(`  ${task.requiredSkills.join(', ')}`);
        console.log('');
      }

      if (recommendation) {
        console.log('Scheduling Recommendation:');
        const startTime = new Date(recommendation.schedulingWindow.startTime).toLocaleString();
        const endTime = new Date(recommendation.schedulingWindow.endTime).toLocaleString();
        console.log(`  Recommended Time: ${startTime} - ${endTime}`);

        if (recommendation.conflicts.length > 0) {
          console.log('  Conflicts:');
          recommendation.conflicts.forEach(conflict => {
            console.log(`    ⚠️ ${conflict}`);
          });
        }

        console.log('  Expected Impact:');
        console.log(`    • Efficiency Gain: ${(recommendation.impact.efficiencyGain * 100).toFixed(1)}%`);
        console.log(`    • Risk Reduction: ${(recommendation.impact.riskReduction * 100).toFixed(1)}%`);

        if (recommendation.alternatives && recommendation.alternatives.length > 0) {
          console.log('  Alternatives:');
          recommendation.alternatives.forEach((alt, index) => {
            const altTime = new Date(alt.startTime).toLocaleString();
            console.log(`    ${index + 1}. ${altTime} (Score: ${(alt.score * 100).toFixed(0)}%)`);
          });
        }
      }

      // Save analysis
      if (options.output) {
        const analysis = {
          task,
          recommendation,
          generatedAt: Date.now(),
        };
        writeFileSync(options.output, JSON.stringify(analysis, null, 2));
        console.log(`💾 Analysis saved to: ${options.output}`);
      }

    } catch (error) {
      console.error('❌ Analysis failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Show or validate forecaster configuration')
  .option('-c, --config <file>', 'Config file to validate/show')
  .option('-o, --output <file>', 'Save default config to file')
  .option('--show-defaults', 'Show default configuration values')
  .option('--validate', 'Validate configuration and show recommendations')
  .action(async (options: any) => {
    try {
      if (options.showDefaults) {
        console.log('🔧 Default Maintenance Task Forecaster Configuration:');
        console.log(JSON.stringify(DEFAULT_MAINTENANCE_FORECAST_CONFIG, null, 2));
        return;
      }

      if (options.output) {
        writeFileSync(options.output, JSON.stringify(DEFAULT_MAINTENANCE_FORECAST_CONFIG, null, 2));
        console.log(`💾 Default config saved to: ${options.output}`);
        return;
      }

      if (options.config) {
        if (!existsSync(options.config)) {
          throw new Error(`Config file not found: ${options.config}`);
        }

        const configData = readFileSync(options.config, 'utf-8');
        const config = JSON.parse(configData);

        console.log('✅ Config file is valid JSON');
        console.log('\n📋 Current Configuration:');

        // Validate and display config
        const fullConfig = { ...DEFAULT_MAINTENANCE_FORECAST_CONFIG, ...config };

        Object.entries(fullConfig).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            console.log(`\n${key}:`);
            Object.entries(value).forEach(([subKey, subValue]) => {
              console.log(`  ${subKey}: ${JSON.stringify(subValue)}`);
            });
          } else {
            console.log(`${key}: ${value}`);
          }
        });

        if (options.validate) {
          console.log('\n🔍 Validation Results:');
          const issues: string[] = [];

          if (fullConfig.forecastHorizonHours < 1 || fullConfig.forecastHorizonHours > 168) {
            issues.push('forecastHorizonHours should be between 1-168 hours');
          }
          if (fullConfig.minConfidenceThreshold < 0 || fullConfig.minConfidenceThreshold > 1) {
            issues.push('minConfidenceThreshold should be between 0-1');
          }
          if (fullConfig.taskGenerationInterval < 60) {
            issues.push('taskGenerationInterval should be at least 60 seconds');
          }

          if (issues.length === 0) {
            console.log('✅ Configuration is valid');
          } else {
            console.log('⚠️ Configuration issues found:');
            issues.forEach(issue => console.log(`  • ${issue}`));
          }
        }

        return;
      }

      // Show usage
      console.log('🔧 Maintenance Task Forecaster Configuration:');
      console.log('');
      console.log('Use one of these options:');
      console.log('  --show-defaults    Show default configuration');
      console.log('  --config <file>    Validate and show config file');
      console.log('  --output <file>    Save default config to file');
      console.log('');
      console.log('Example:');
      console.log('  maintenance-forecast config --show-defaults');

    } catch (error) {
      console.error('❌ Config command failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Simulate command
program
  .command('simulate')
  .description('Run simulation with forecasted tasks')
  .option('-s, --state <file>', 'Village state JSON file')
  .option('-c, --config <file>', 'Forecaster config JSON file')
  .option('-d, --duration <hours>', 'Simulation duration in hours', '24')
  .option('-o, --output <file>', 'Save simulation results to JSON file')
  .option('-v, --verbose', 'Show detailed simulation progress')
  .action(async (options: any) => {
    try {
      console.log('🎮 Starting maintenance task simulation...');

      // Create forecaster
      const forecaster = await createForecaster(options.config);

      // Load initial village state
      const initialState = await loadVillageState(options.state);
      const simulationDuration = parseInt(options.duration) * 60 * 60 * 1000; // Convert to milliseconds
      const endTime = initialState.timestamp + simulationDuration;

      const currentState = { ...initialState };
      const simulationResults = {
        startTime: initialState.timestamp,
        endTime,
        durationHours: parseInt(options.duration),
        initialTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        finalState: null as any,
        taskHistory: [] as any[],
      };

      // Initial forecast
      const initialForecast = forecaster.generateForecast(currentState);
      simulationResults.initialTasks = initialForecast.tasks.length;

      if (options.verbose) {
        console.log(`📊 Initial forecast: ${initialForecast.tasks.length} tasks`);
      }

      // Simulation loop (simplified - would need more complex scheduling logic)
      let currentTime = currentState.timestamp;
      const timeStep = 30 * 60 * 1000; // 30 minutes

      while (currentTime < endTime) {
        // Generate updated forecast
        const forecast = forecaster.generateForecast(currentState);

        // Simulate task completion (simplified logic)
        const availableTasks = forecast.tasks.filter(task =>
          task.status === 'pending' &&
          task.targetCompletionTime <= currentTime + timeStep
        );

        availableTasks.forEach(task => {
          // Simple success/failure simulation
          const success = Math.random() > 0.1; // 90% success rate

          if (success) {
            task.status = 'completed';
            task.completedAt = currentTime;
            simulationResults.completedTasks++;

            // Apply task effects to state (simplified)
            if (task.category === 'resource_replenishment') {
              currentState.resources = {
                ...currentState.resources,
                food: (currentState.resources.food || 0) + 50,
              };
            }
          } else {
            task.status = 'cancelled';
            simulationResults.failedTasks++;
          }

          simulationResults.taskHistory.push({
            time: currentTime,
            taskId: task.id,
            taskName: task.name,
            status: task.status,
          });
        });

        currentTime += timeStep;

        if (options.verbose && availableTasks.length > 0) {
          console.log(`⏰ ${new Date(currentTime).toLocaleTimeString()}: ${availableTasks.length} tasks processed`);
        }
      }

      simulationResults.finalState = currentState;

      // Display results
      console.log('\n🎮 Simulation Results:');
      console.log(`Duration: ${simulationResults.durationHours} hours`);
      console.log(`Initial Tasks: ${simulationResults.initialTasks}`);
      console.log(`Completed Tasks: ${simulationResults.completedTasks}`);
      console.log(`Failed Tasks: ${simulationResults.failedTasks}`);
      console.log(`Success Rate: ${simulationResults.initialTasks > 0 ? ((simulationResults.completedTasks / simulationResults.initialTasks) * 100).toFixed(1) : 0}%`);

      // Save results
      if (options.output) {
        writeFileSync(options.output, JSON.stringify(simulationResults, null, 2));
        console.log(`💾 Simulation results saved to: ${options.output}`);
      }

    } catch (error) {
      console.error('❌ Simulation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', (unknownCommand) => {
  console.error(`❌ Unknown command: ${unknownCommand[0]}`);
  console.log('Run with --help to see available commands');
  process.exit(1);
});

// Parse arguments
program.parse();
