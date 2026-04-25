/**
 * NP-095 – Config Balancer Stress Batch Runner CLI
 *
 * Command-line interface for running versioned stress test scenarios in batches.
 * Provides configuration management, batch execution, and result reporting.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { writeFileSync } from 'fs';
import { ConfigBalancerBatchRunner, type BatchConfig } from '../../src/balancing/stressTesting/ConfigBalancerBatchRunner';
import {
  SCENARIO_PRESETS,
  VERSIONED_SCENARIOS,
  createBatchFromPreset,
  createCustomBatch,
  getAvailableScenarios,
  findScenariosByTags,
  validateBatchConfig,
} from '../../src/balancing/stressTesting/VersionedScenarios';

/**
 * CLI configuration options
 */
interface BatchRunnerCLIConfig {
  /** Command to execute */
  command: 'run' | 'list' | 'validate' | 'create' | 'export';
  /** Preset name for batch creation */
  preset?: string;
  /** Custom scenario IDs */
  scenarioIds?: string[];
  /** Scenario tags for filtering */
  tags?: string[];
  /** Batch configuration file */
  configFile?: string;
  /** Output directory */
  outputDir?: string;
  /** Execution mode */
  executionMode?: 'sequential' | 'parallel';
  /** Max parallel executions */
  maxParallel?: number;
  /** Batch ID */
  batchId?: string;
  /** Batch name */
  batchName?: string;
  /** Environment */
  environment?: string;
  /** Enable progress display */
  progress?: boolean;
  /** JSON output for list command */
  json?: boolean;
}

/**
 * Default CLI configuration
 */
const DEFAULT_BATCH_RUNNER_CLI_CONFIG: Partial<BatchRunnerCLIConfig> = {
  executionMode: 'sequential',
  maxParallel: 2,
  environment: 'development',
  progress: true,
  json: false,
};

/**
 * Config Balancer Stress Batch Runner CLI
 */
export class ConfigBalancerBatchRunnerCLI {
  private config: BatchRunnerCLIConfig;

  constructor(config: BatchRunnerCLIConfig) {
    this.config = { ...DEFAULT_BATCH_RUNNER_CLI_CONFIG, ...config };
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(args: string[]): BatchRunnerCLIConfig {
    const parsed: BatchRunnerCLIConfig = {
      command: 'run',
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case 'run':
        case 'list':
        case 'validate':
        case 'create':
        case 'export':
          parsed.command = arg;
          break;
        case '--preset':
        case '-p':
          parsed.preset = args[++i];
          break;
        case '--scenarios':
        case '-s':
          parsed.scenarioIds = args[++i].split(',');
          break;
        case '--tags':
        case '-t':
          parsed.tags = args[++i].split(',');
          break;
        case '--config':
        case '-c':
          parsed.configFile = args[++i];
          break;
        case '--output':
        case '-o':
          parsed.outputDir = args[++i];
          break;
        case '--mode':
        case '-m':
          parsed.executionMode = args[++i] as 'sequential' | 'parallel';
          break;
        case '--parallel':
          parsed.maxParallel = parseInt(args[++i], 10);
          break;
        case '--batch-id':
          parsed.batchId = args[++i];
          break;
        case '--batch-name':
          parsed.batchName = args[++i];
          break;
        case '--environment':
        case '-e':
          parsed.environment = args[++i];
          break;
        case '--no-progress':
          parsed.progress = false;
          break;
        case '--json':
        case '-j':
          parsed.json = true;
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
          break;
      }
    }

    return { ...DEFAULT_BATCH_RUNNER_CLI_CONFIG, ...parsed };
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
Config Balancer Stress Batch Runner CLI

Usage: config-balancer-batch-runner <command> [options]

Commands:
  run        Execute a batch of stress test scenarios
  list       List available scenarios and presets
  validate   Validate batch configuration
  create     Create batch configuration from scenarios
  export     Export batch results to different formats

Options:
  -p, --preset <name>         Use a preset batch configuration (ci, standard, comprehensive, regression, performance)
  -s, --scenarios <ids>       Comma-separated scenario IDs to include
  -t, --tags <tags>           Comma-separated tags to filter scenarios
  -c, --config <file>         Batch configuration file path
  -o, --output <dir>          Output directory for results
  -m, --mode <mode>           Execution mode (sequential|parallel)
  --parallel <number>         Maximum parallel executions
  --batch-id <id>             Custom batch ID
  --batch-name <name>         Custom batch name
  -e, --environment <env>     Execution environment
  --no-progress               Disable progress display
  -j, --json                  JSON output for list command
  -h, --help                  Show this help message

Examples:
  # Run a preset batch
  config-balancer-batch-runner run --preset standard

  # Run custom scenarios
  config-balancer-batch-runner run --scenarios quick-validation-v1.0,standard-analysis-v1.0

  # Run scenarios by tags
  config-balancer-batch-runner run --tags validation,analysis --mode parallel

  # List available scenarios
  config-balancer-batch-runner list

  # Create custom batch configuration
  config-balancer-batch-runner create --scenarios quick-validation-v1.0 --batch-id my-batch --output ./my-batch-config.json

  # Validate configuration
  config-balancer-batch-runner validate --config ./batch-config.json

Available Presets:
  ci            - Fast validation for CI/CD
  standard      - Balanced analysis scenarios
  comprehensive - Thorough analysis suite
  regression    - Stable regression testing
  performance   - High-throughput performance testing

Available Scenario Tags:
  validation    - Validation and smoke testing
  quick         - Fast execution scenarios
  analysis      - Comprehensive analysis scenarios
  performance   - Performance benchmarking
  regression    - Stable regression testing
  edge-case     - Edge case and boundary testing
  balanced      - Balanced resource usage
  detailed      - Detailed result generation
  benchmark     - Performance benchmarking
  boundary      - Boundary condition testing
  stable        - Stable and reproducible results
  throughput    - High-throughput scenarios
`);
  }

  /**
   * Execute run command
   */
  private async executeRun(): Promise<void> {
    let batchConfig: BatchConfig;

    // Determine batch configuration source
    if (this.config.configFile) {
      // Load from file
      console.log(`Loading batch configuration from: ${this.config.configFile}`);
      // In a real implementation, this would load from file
      throw new Error('Loading from config file not yet implemented');
    } else if (this.config.preset) {
      // Use preset
      if (!(this.config.preset! in SCENARIO_PRESETS)) {
        throw new Error(`Unknown preset: ${this.config.preset}. Available: ${Object.keys(SCENARIO_PRESETS).join(', ')}`);
      }
      console.log(`Using preset: ${this.config.preset}`);
      batchConfig = createBatchFromPreset(this.config.preset as keyof typeof SCENARIO_PRESETS, {
        executionMode: this.config.executionMode,
        environment: this.config.environment,
        outputDir: this.config.outputDir,
      });
    } else if (this.config.scenarioIds) {
      // Custom scenarios by ID
      const scenarios = this.config.scenarioIds
        .map((id: string) => {
          const scenario = Object.values(VERSIONED_SCENARIOS).find((s: typeof VERSIONED_SCENARIOS[keyof typeof VERSIONED_SCENARIOS]) =>
            `${s.id}-v${s.version}` === id || s.id === id
          );
          if (!scenario) {
            throw new Error(`Unknown scenario: ${id}`);
          }
          return scenario;
        });

      batchConfig = createCustomBatch(scenarios, {
        batchId: this.config.batchId || `custom-batch-${Date.now()}`,
        batchName: this.config.batchName || 'Custom Batch',
        batchDescription: `Custom batch with scenarios: ${this.config.scenarioIds.join(', ')}`,
        executionMode: this.config.executionMode,
        maxParallel: this.config.maxParallel,
        environment: this.config.environment,
        outputDir: this.config.outputDir,
      });
    } else if (this.config.tags) {
      // Scenarios by tags
      const scenarios = findScenariosByTags(this.config.tags);
      if (scenarios.length === 0) {
        throw new Error(`No scenarios found for tags: ${this.config.tags.join(', ')}`);
      }

      batchConfig = createCustomBatch(scenarios, {
        batchId: this.config.batchId || `tagged-batch-${Date.now()}`,
        batchName: this.config.batchName || `Batch by Tags: ${this.config.tags.join(', ')}`,
        batchDescription: `Batch filtered by tags: ${this.config.tags.join(', ')}`,
        executionMode: this.config.executionMode,
        maxParallel: this.config.maxParallel,
        environment: this.config.environment,
        outputDir: this.config.outputDir,
      });
    } else {
      throw new Error('Must specify --preset, --scenarios, --tags, or --config');
    }

    // Validate configuration
    const validation = validateBatchConfig(batchConfig);
    if (!validation.valid) {
      throw new Error(`Invalid batch configuration: ${validation.errors.join(', ')}`);
    }

    console.log(`🚀 Starting batch execution: ${batchConfig.name}`);
    console.log(`   ID: ${batchConfig.id}`);
    console.log(`   Scenarios: ${batchConfig.scenarios.length}`);
    console.log(`   Mode: ${batchConfig.execution.mode}`);
    console.log(`   Environment: ${batchConfig.metadata.environment}`);
    console.log('');

    // Create and configure runner
    const runner = new ConfigBalancerBatchRunner(batchConfig);

    if (this.config.progress) {
      runner.setProgressCallback((progress) => {
        this.displayProgress(progress);
      });
    }

    // Execute batch
    const startTime = Date.now();
    const results = await runner.executeBatch();
    const endTime = Date.now();

    console.log('');
    console.log('✅ Batch execution completed!');
    console.log(`   Total time: ${((endTime - startTime) / 1000).toFixed(1)}s`);
    console.log(`   Success rate: ${(results.summary.successRate * 100).toFixed(1)}%`);
    console.log(`   Results saved to: ${batchConfig.reporting.outputDir}`);

    // Display summary
    this.displayBatchSummary(results);
  }

  /**
   * Execute list command
   */
  private executeList(): void {
    if (this.config.json) {
      // JSON output
      const data = {
        presets: Object.entries(SCENARIO_PRESETS).map(([key, preset]) => ({
          id: key,
          name: preset.name,
          description: preset.description,
          scenarioCount: preset.scenarios.length,
          estimatedRuntime: preset.scenarios.reduce((sum, s) => sum + s.estimatedRuntimeMinutes, 0),
        })),
        scenarios: getAvailableScenarios().map(scenario => ({
          id: scenario.id,
          version: scenario.version,
          name: scenario.name,
          description: scenario.description,
          tags: scenario.tags,
          estimatedRuntimeMinutes: scenario.estimatedRuntimeMinutes,
          priority: scenario.priority,
        })),
      };
      console.log(JSON.stringify(data, null, 2));
    } else {
      // Human-readable output
      console.log('📋 Available Presets:');
      console.log('');

      Object.entries(SCENARIO_PRESETS).forEach(([key, preset]: [string, typeof SCENARIO_PRESETS[keyof typeof SCENARIO_PRESETS]]) => {
        console.log(`🔸 ${key}`);
        console.log(`   ${preset.name}`);
        console.log(`   ${preset.description}`);
        console.log(`   Scenarios: ${preset.scenarios.length}`);
        const totalRuntime = preset.scenarios.reduce((sum: number, s) => sum + s.estimatedRuntimeMinutes, 0);
        console.log(`   Est. Runtime: ${totalRuntime} minutes`);
        console.log('');
      });

      console.log('📋 Available Scenarios:');
      console.log('');

      getAvailableScenarios().forEach(scenario => {
        console.log(`🔹 ${scenario.id} (v${scenario.version})`);
        console.log(`   ${scenario.name}`);
        console.log(`   ${scenario.description}`);
        console.log(`   Tags: ${scenario.tags.join(', ')}`);
        console.log(`   Priority: ${scenario.priority}`);
        console.log(`   Est. Runtime: ${scenario.estimatedRuntimeMinutes} minutes`);
        console.log('');
      });
    }
  }

  /**
   * Execute validate command
   */
  private executeValidate(): void {
    if (!this.config.configFile) {
      throw new Error('--config file is required for validate command');
    }

    console.log(`Validating configuration: ${this.config.configFile}`);
    // In a real implementation, this would load and validate the config file
    console.log('✅ Configuration validation not yet implemented');
  }

  /**
   * Execute create command
   */
  private executeCreate(): void {
    if (!this.config.scenarioIds && !this.config.tags) {
      throw new Error('Must specify --scenarios or --tags for create command');
    }

    let scenarios: ReturnType<typeof findScenariosByTags> = [];
    let batchName = 'Custom Batch';
    let batchDescription = 'Custom batch configuration';

    if (this.config.scenarioIds) {
      scenarios = this.config.scenarioIds.map((id: string) => {
        const scenario = Object.values(VERSIONED_SCENARIOS).find((s: typeof VERSIONED_SCENARIOS[keyof typeof VERSIONED_SCENARIOS]) =>
          `${s.id}-v${s.version}` === id || s.id === id
        );
        if (!scenario) {
          throw new Error(`Unknown scenario: ${id}`);
        }
        return scenario;
      });
      batchDescription = `Custom batch with scenarios: ${this.config.scenarioIds.join(', ')}`;
    } else if (this.config.tags) {
      scenarios = findScenariosByTags(this.config.tags);
      if (scenarios.length === 0) {
        throw new Error(`No scenarios found for tags: ${this.config.tags.join(', ')}`);
      }
      batchName = `Batch by Tags: ${this.config.tags.join(', ')}`;
      batchDescription = `Batch filtered by tags: ${this.config.tags.join(', ')}`;
    }

    const batchConfig = createCustomBatch(scenarios, {
      batchId: this.config.batchId || `custom-batch-${Date.now()}`,
      batchName: this.config.batchName || batchName,
      batchDescription,
      executionMode: this.config.executionMode,
      maxParallel: this.config.maxParallel,
      environment: this.config.environment,
      outputDir: this.config.outputDir,
    });

    const outputPath = this.config.outputDir || './batch-config.json';
    writeFileSync(outputPath, JSON.stringify(batchConfig, null, 2), 'utf8');

    console.log(`✅ Batch configuration created: ${outputPath}`);
    console.log(`   Scenarios: ${scenarios.length}`);
    console.log(`   Execution mode: ${batchConfig.execution.mode}`);
  }

  /**
   * Execute export command
   */
  private executeExport(): void {
    console.log('📊 Export functionality not yet implemented');
    // In a real implementation, this would export existing batch results to different formats
  }

  /**
   * Display progress information
   */
  private displayProgress(progress: Parameters<ConfigBalancerBatchRunner['setProgressCallback']>[0]): void {
    const stage = progress.stage.toUpperCase();
    const percent = Math.round(progress.overallProgress);

    let statusLine = `[${stage}] ${percent}% `;

    if (progress.currentScenario) {
      statusLine += `- ${progress.currentScenario}`;
    }

    if (progress.scenarioProgress !== undefined) {
      statusLine += ` (${progress.scenarioProgress}%)`;
    }

    statusLine += ` - ${progress.message}`;

    console.log(statusLine);
  }

  /**
   * Display batch execution summary
   */
  private displayBatchSummary(results: Awaited<ReturnType<ConfigBalancerBatchRunner['executeBatch']>>): void {
    console.log('');
    console.log('📊 Batch Execution Summary:');
    console.log(`   Scenarios: ${results.summary.totalScenarios}`);
    console.log(`   Successful: ${results.summary.successful}`);
    console.log(`   Failed: ${results.summary.failed}`);
    console.log(`   Timeout: ${results.summary.timeout}`);
    console.log(`   Skipped: ${results.summary.skipped}`);
    console.log(`   Success Rate: ${(results.summary.successRate * 100).toFixed(1)}%`);
    console.log(`   Total Time: ${((results.summary.endTime - results.summary.startTime) / 1000).toFixed(1)}s`);
    console.log(`   Avg Time/Scenario: ${(results.summary.averageExecutionTimeMs / 1000).toFixed(1)}s`);

    if (results.scenarioResults.length > 0) {
      console.log('');
      console.log('📋 Scenario Results:');
      results.scenarioResults.forEach((result: Awaited<ReturnType<ConfigBalancerBatchRunner['executeBatch']>>['scenarioResults'][0]) => {
        const status = result.status === 'success' ? '✅' :
                      result.status === 'failed' ? '❌' :
                      result.status === 'timeout' ? '⏰' : '⏭️';
        const time = ((result.endTime - result.startTime) / 1000).toFixed(1);
        console.log(`   ${status} ${result.scenario.name} (${time}s)`);
        if (result.error) {
          console.log(`      Error: ${result.error}`);
        }
      });
    }
  }

  /**
   * Run the CLI
   */
  public async run(args: string[]): Promise<void> {
    try {
      this.config = this.parseArgs(args);

      switch (this.config.command) {
        case 'run':
          await this.executeRun();
          break;
        case 'list':
          this.executeList();
          break;
        case 'validate':
          this.executeValidate();
          break;
        case 'create':
          this.executeCreate();
          break;
        case 'export':
          this.executeExport();
          break;
        default:
          throw new Error(`Unknown command: ${this.config.command}`);
      }
    } catch (error) {
      console.error('CLI execution failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}

/**
 * Main CLI entry point
 */
export async function main(): Promise<void> {
  const cli = new ConfigBalancerBatchRunnerCLI({} as BatchRunnerCLIConfig);
  await cli.run(process.argv.slice(2));
}
