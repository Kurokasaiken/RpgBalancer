/**
 * NP-095 – Config Balancer Stress Batch Runner
 *
 * Config-first batch runner for stress testing with versioned scenarios and sample reports.
 * Orchestrates multiple stress test scenarios with versioning, batch execution, and aggregated reporting.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { StressTestRunner, type StressTestResults, type StressTestRunnerConfig } from './StressTestRunner';
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';
import { saveData } from '@/shared/persistence/PersistenceService';
import type { MarginalUtilityAnalysis } from './MarginalUtilityTypes';

/**
 * Versioned stress test scenario configuration
 */
export interface VersionedScenario {
  /** Unique scenario identifier */
  id: string;
  /** Scenario version for reproducibility */
  version: string;
  /** Human-readable scenario name */
  name: string;
  /** Scenario description */
  description: string;
  /** Stress test runner configuration */
  runnerConfig: StressTestRunnerConfig;
  /** Scenario tags for filtering */
  tags: string[];
  /** Expected runtime estimate (minutes) */
  estimatedRuntimeMinutes: number;
  /** Scenario priority (higher = more important) */
  priority: number;
}

/**
 * Batch execution configuration
 */
export interface BatchExecutionConfig {
  /** Execution mode */
  mode: 'sequential' | 'parallel';
  /** Maximum parallel executions */
  maxParallel: number;
  /** Continue on scenario failure */
  continueOnFailure: boolean;
  /** Stop on first failure */
  stopOnFailure: boolean;
  /** Execution timeout per scenario (minutes) */
  scenarioTimeoutMinutes: number;
  /** Global timeout for entire batch (minutes) */
  batchTimeoutMinutes: number;
}

/**
 * Batch configuration
 */
export interface BatchConfig {
  /** Batch identifier */
  id: string;
  /** Batch name */
  name: string;
  /** Batch description */
  description: string;
  /** Versioned scenarios to run */
  scenarios: VersionedScenario[];
  /** Execution configuration */
  execution: BatchExecutionConfig;
  /** Reporting configuration */
  reporting: {
    /** Generate summary report */
    enableSummaryReport: boolean;
    /** Generate detailed scenario reports */
    enableDetailedReports: boolean;
    /** Generate comparison report */
    enableComparisonReport: boolean;
    /** Output directory */
    outputDir: string;
    /** Report formats */
    formats: ('json' | 'csv' | 'markdown')[];
  };
  /** Metadata */
  metadata: {
    /** Created by */
    createdBy: string;
    /** Creation timestamp */
    createdAt: string;
    /** Target balancer version */
    targetBalancerVersion?: string;
    /** Environment */
    environment: string;
  };
}

/**
 * Batch execution result for a single scenario
 */
export interface ScenarioExecutionResult {
  /** Scenario that was executed */
  scenario: VersionedScenario;
  /** Execution status */
  status: 'success' | 'failed' | 'timeout' | 'skipped';
  /** Execution results (if successful) */
  results?: StressTestResults;
  /** Error message (if failed) */
  error?: string;
  /** Execution start time */
  startTime: number;
  /** Execution end time */
  endTime: number;
  /** Execution duration (ms) */
  durationMs: number;
}

/**
 * Complete batch execution results
 */
export interface BatchExecutionResults {
  /** Batch configuration */
  config: BatchConfig;
  /** Results for each scenario */
  scenarioResults: ScenarioExecutionResult[];
  /** Batch-level summary */
  summary: {
    /** Total scenarios */
    totalScenarios: number;
    /** Successful executions */
    successful: number;
    /** Failed executions */
    failed: number;
    /** Timeout executions */
    timeout: number;
    /** Skipped executions */
    skipped: number;
    /** Total execution time */
    totalExecutionTimeMs: number;
    /** Average execution time per scenario */
    averageExecutionTimeMs: number;
    /** Batch start time */
    startTime: number;
    /** Batch end time */
    endTime: number;
    /** Success rate */
    successRate: number;
  };
  /** Batch execution metadata */
  metadata: {
    /** Batch run ID */
    runId: string;
    /** Balancer config hash */
    balancerConfigHash: string;
    /** Execution environment */
    environment: string;
    /** Execution mode */
    executionMode: 'sequential' | 'parallel';
  };
}

/**
 * Progress callback for batch execution
 */
export interface BatchProgressCallback {
  (progress: {
    /** Current stage */
    stage: 'initializing' | 'executing' | 'finalizing' | 'completed';
    /** Overall progress (0-100) */
    overallProgress: number;
    /** Current scenario being executed */
    currentScenario?: string;
    /** Scenario progress (0-100) */
    scenarioProgress?: number;
    /** Completed scenarios */
    completedScenarios: number;
    /** Total scenarios */
    totalScenarios: number;
    /** Estimated time remaining (ms) */
    estimatedTimeRemaining?: number;
    /** Status message */
    message: string;
  }): void;
}

/**
 * Config Balancer Stress Batch Runner
 */
export class ConfigBalancerBatchRunner {
  private config: BatchConfig;
  private progressCallback?: BatchProgressCallback;

  constructor(config: BatchConfig) {
    this.config = config;
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback: BatchProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * Execute the batch run
   */
  async executeBatch(): Promise<BatchExecutionResults> {
    const startTime = Date.now();
    const runId = `batch-${this.config.id}-${startTime}`;

    this.reportProgress({
      stage: 'initializing',
      overallProgress: 0,
      completedScenarios: 0,
      totalScenarios: this.config.scenarios.length,
      message: 'Initializing batch execution...',
    });

    // Load balancer config for hash
    const balancerConfig = await BalancerConfigStore.load();
    const balancerConfigHash = this.generateConfigHash(balancerConfig);

    // Sort scenarios by priority (highest first)
    const sortedScenarios = [...this.config.scenarios].sort((a, b) => b.priority - a.priority);

    const scenarioResults: ScenarioExecutionResult[] = [];
    let completedCount = 0;

    this.reportProgress({
      stage: 'executing',
      overallProgress: 5,
      completedScenarios: 0,
      totalScenarios: sortedScenarios.length,
      message: `Starting execution of ${sortedScenarios.length} scenarios...`,
    });

    if (this.config.execution.mode === 'parallel') {
      await this.executeParallel(sortedScenarios, scenarioResults, (completed) => {
        completedCount = completed;
        const progress = 5 + (completed / sortedScenarios.length) * 90;
        this.reportProgress({
          stage: 'executing',
          overallProgress: progress,
          completedScenarios: completed,
          totalScenarios: sortedScenarios.length,
          message: `Completed ${completed}/${sortedScenarios.length} scenarios`,
        });
      });
    } else {
      await this.executeSequential(sortedScenarios, scenarioResults, (scenario, progress) => {
        completedCount++;
        const overallProgress = 5 + (completedCount / sortedScenarios.length) * 90;
        this.reportProgress({
          stage: 'executing',
          overallProgress,
          currentScenario: scenario.name,
          scenarioProgress: progress,
          completedScenarios: completedCount,
          totalScenarios: sortedScenarios.length,
          message: `Executing ${scenario.name} (${completedCount}/${sortedScenarios.length})`,
        });
      });
    }

    const endTime = Date.now();

    this.reportProgress({
      stage: 'finalizing',
      overallProgress: 95,
      completedScenarios: completedCount,
      totalScenarios: sortedScenarios.length,
      message: 'Generating reports...',
    });

    // Generate reports
    await this.generateReports(scenarioResults, runId);

    // Calculate summary
    const summary = this.calculateSummary(scenarioResults, startTime, endTime);

    const results: BatchExecutionResults = {
      config: this.config,
      scenarioResults,
      summary,
      metadata: {
        runId,
        balancerConfigHash,
        environment: this.config.metadata.environment,
        executionMode: this.config.execution.mode,
      },
    };

    this.reportProgress({
      stage: 'completed',
      overallProgress: 100,
      completedScenarios: completedCount,
      totalScenarios: sortedScenarios.length,
      message: `Batch completed. ${summary.successful}/${summary.totalScenarios} scenarios successful.`,
    });

    return results;
  }

  /**
   * Execute scenarios in parallel
   */
  private async executeParallel(
    scenarios: VersionedScenario[],
    results: ScenarioExecutionResult[],
    onProgress: (completed: number) => void
  ): Promise<void> {
    const maxParallel = Math.min(this.config.execution.maxParallel, scenarios.length);
    const batches: VersionedScenario[][] = [];

    // Split scenarios into batches
    for (let i = 0; i < scenarios.length; i += maxParallel) {
      batches.push(scenarios.slice(i, i + maxParallel));
    }

    let completed = 0;

    for (const batch of batches) {
      const batchPromises = batch.map(scenario =>
        this.executeScenario(scenario, results)
      );

      await Promise.allSettled(batchPromises);
      completed += batch.length;
      onProgress(completed);
    }
  }

  /**
   * Execute scenarios sequentially
   */
  private async executeSequential(
    scenarios: VersionedScenario[],
    results: ScenarioExecutionResult[],
    onProgress: (scenario: VersionedScenario, progress: number) => void
  ): Promise<void> {
    for (const scenario of scenarios) {
      try {
        const result = await this.executeScenarioWithProgress(scenario, (progress) => {
          onProgress(scenario, progress);
        });
        results.push(result);
      } catch (error) {
        // Handle execution errors
        results.push({
          scenario,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          startTime: Date.now(),
          endTime: Date.now(),
          durationMs: 0,
        });
      }
    }
  }

  /**
   * Execute a single scenario
   */
  private async executeScenario(
    scenario: VersionedScenario,
    results: ScenarioExecutionResult[]
  ): Promise<void> {
    try {
      const result = await this.executeScenarioWithProgress(scenario);
      results.push(result);
    } catch (error) {
      results.push({
        scenario,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        startTime: Date.now(),
        endTime: Date.now(),
        durationMs: 0,
      });

      if (!this.config.execution.continueOnFailure) {
        throw error;
      }
    }
  }

  /**
   * Execute a scenario with progress tracking
   */
  private async executeScenarioWithProgress(
    scenario: VersionedScenario,
    progressCallback?: (progress: number) => void
  ): Promise<ScenarioExecutionResult> {
    const startTime = Date.now();

    try {
      const runner = new StressTestRunner(scenario.runnerConfig);

      if (progressCallback) {
        runner.setProgressCallback((progress) => {
          progressCallback(progress.progress);
        });
      }

      const results = await this.withTimeout(
        runner.runStressTest(),
        this.config.execution.scenarioTimeoutMinutes * 60 * 1000
      );

      const endTime = Date.now();

      return {
        scenario,
        status: 'success',
        results,
        startTime,
        endTime,
        durationMs: endTime - startTime,
      };
    } catch (error) {
      const endTime = Date.now();

      if (error instanceof Error && error.message === 'Timeout') {
        return {
          scenario,
          status: 'timeout',
          error: `Scenario timed out after ${this.config.execution.scenarioTimeoutMinutes} minutes`,
          startTime,
          endTime,
          durationMs: endTime - startTime,
        };
      }

      return {
        scenario,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        startTime,
        endTime,
        durationMs: endTime - startTime,
      };
    }
  }

  /**
   * Execute a promise with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout'));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Generate reports from batch results
   */
  private async generateReports(
    scenarioResults: ScenarioExecutionResult[],
    runId: string
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = `${this.config.reporting.outputDir}/${runId}-${timestamp}`;

    // Generate summary report
    if (this.config.reporting.enableSummaryReport) {
      const summaryData = this.generateSummaryReport(scenarioResults, runId);
      await this.saveReport(summaryData, baseDir, 'summary', this.config.reporting.formats);
    }

    // Generate detailed scenario reports
    if (this.config.reporting.enableDetailedReports) {
      for (const result of scenarioResults) {
        if (result.status === 'success' && result.results) {
          const detailedData = this.generateDetailedScenarioReport(result);
          await this.saveReport(detailedData, baseDir, `scenario-${result.scenario.id}`, ['json']);
        }
      }
    }

    // Generate comparison report
    if (this.config.reporting.enableComparisonReport) {
      const comparisonData = this.generateComparisonReport(scenarioResults);
      await this.saveReport(comparisonData, baseDir, 'comparison', this.config.reporting.formats);
    }
  }

  /**
   * Generate summary report
   */
  private generateSummaryReport(
    scenarioResults: ScenarioExecutionResult[],
    runId: string
  ): any {
    const successfulResults = scenarioResults.filter(r => r.status === 'success');

    return {
      runId,
      timestamp: new Date().toISOString(),
      batchConfig: {
        id: this.config.id,
        name: this.config.name,
        description: this.config.description,
        totalScenarios: this.config.scenarios.length,
      },
      execution: {
        mode: this.config.execution.mode,
        scenariosExecuted: scenarioResults.length,
        successful: successfulResults.length,
        failed: scenarioResults.filter(r => r.status === 'failed').length,
        timeout: scenarioResults.filter(r => r.status === 'timeout').length,
        averageExecutionTimeMs: successfulResults.reduce((sum, r) => sum + r.durationMs, 0) / successfulResults.length,
        totalExecutionTimeMs: Math.max(...scenarioResults.map(r => r.endTime)) - Math.min(...scenarioResults.map(r => r.startTime)),
      },
      topPerformers: successfulResults
        .filter(r => r.results)
        .sort((a, b) => (b.results!.analysis.summary.opSynergiesCount + b.results!.analysis.summary.significantSynergiesCount) -
                        (a.results!.analysis.summary.opSynergiesCount + a.results!.analysis.summary.significantSynergiesCount))
        .slice(0, 5)
        .map(r => ({
          scenarioId: r.scenario.id,
          scenarioName: r.scenario.name,
          opSynergies: r.results!.analysis.summary.opSynergiesCount,
          significantSynergies: r.results!.analysis.summary.significantSynergiesCount,
          executionTimeMs: r.durationMs,
        })),
      scenarioResults: scenarioResults.map(r => ({
        id: r.scenario.id,
        name: r.scenario.name,
        version: r.scenario.version,
        status: r.status,
        executionTimeMs: r.durationMs,
        error: r.error,
      })),
    };
  }

  /**
   * Generate detailed scenario report
   */
  private generateDetailedScenarioReport(result: ScenarioExecutionResult): any {
    if (!result.results) return null;

    return {
      scenario: {
        id: result.scenario.id,
        name: result.scenario.name,
        version: result.scenario.version,
        description: result.scenario.description,
      },
      execution: {
        status: result.status,
        startTime: new Date(result.startTime).toISOString(),
        endTime: new Date(result.endTime).toISOString(),
        durationMs: result.durationMs,
      },
      results: result.results,
    };
  }

  /**
   * Generate comparison report
   */
  private generateComparisonReport(scenarioResults: ScenarioExecutionResult[]): any {
    const successfulResults = scenarioResults.filter(r => r.status === 'success' && r.results);

    const comparisons = successfulResults.map(result => ({
      scenarioId: result.scenario.id,
      scenarioName: result.scenario.name,
      version: result.scenario.version,
      metrics: {
        totalSimulations: result.results!.analysis.summary.totalSimulations,
        opSynergies: result.results!.analysis.summary.opSynergiesCount,
        weakSynergies: result.results!.analysis.summary.weakSynergiesCount,
        significantSynergies: result.results!.analysis.summary.significantSynergiesCount,
        avgSimulationsPerSecond: result.results!.analysis.summary.avgSimulationsPerSecond,
        totalRuntimeMs: result.results!.analysis.summary.totalRuntimeMs,
        executionTimeMs: result.durationMs,
      },
    }));

    return {
      timestamp: new Date().toISOString(),
      totalScenarios: successfulResults.length,
      comparisons,
      rankings: {
        byOpSynergies: [...comparisons].sort((a, b) => b.metrics.opSynergies - a.metrics.opSynergies),
        bySignificantSynergies: [...comparisons].sort((a, b) => b.metrics.significantSynergies - a.metrics.significantSynergies),
        byPerformance: [...comparisons].sort((a, b) => b.metrics.avgSimulationsPerSecond - a.metrics.avgSimulationsPerSecond),
        byExecutionTime: [...comparisons].sort((a, b) => a.metrics.executionTimeMs - b.metrics.executionTimeMs),
      },
    };
  }

  /**
   * Save report in specified formats
   */
  private async saveReport(
    data: any,
    baseDir: string,
    filename: string,
    formats: ('json' | 'csv' | 'markdown')[]
  ): Promise<void> {
    for (const format of formats) {
      const fullPath = `${baseDir}/${filename}.${format}`;

      let content: string;
      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          break;
        case 'csv':
          content = this.convertReportToCSV(data);
          break;
        case 'markdown':
          content = this.convertReportToMarkdown(data);
          break;
        default:
          continue;
      }

      await saveData(fullPath, content);
    }
  }

  /**
   * Convert report data to CSV (simplified implementation)
   */
  private convertReportToCSV(data: any): string {
    // Simplified CSV conversion for reports
    // In a full implementation, this would handle nested objects properly
    return JSON.stringify(data);
  }

  /**
   * Convert report data to Markdown (simplified implementation)
   */
  private convertReportToMarkdown(data: any): string {
    // Simplified Markdown conversion
    const markdown = `# Report\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
    return markdown;
  }

  /**
   * Calculate batch summary
   */
  private calculateSummary(
    scenarioResults: ScenarioExecutionResult[],
    startTime: number,
    endTime: number
  ): BatchExecutionResults['summary'] {
    const totalScenarios = scenarioResults.length;
    const successful = scenarioResults.filter(r => r.status === 'success').length;
    const failed = scenarioResults.filter(r => r.status === 'failed').length;
    const timeout = scenarioResults.filter(r => r.status === 'timeout').length;
    const skipped = scenarioResults.filter(r => r.status === 'skipped').length;

    const successfulResults = scenarioResults.filter(r => r.status === 'success');
    const averageExecutionTimeMs = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.durationMs, 0) / successfulResults.length
      : 0;

    return {
      totalScenarios,
      successful,
      failed,
      timeout,
      skipped,
      totalExecutionTimeMs: endTime - startTime,
      averageExecutionTimeMs,
      startTime,
      endTime,
      successRate: totalScenarios > 0 ? successful / totalScenarios : 0,
    };
  }

  /**
   * Generate configuration hash
   */
  private generateConfigHash(config: any): string {
    const configString = JSON.stringify(config);

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < configString.length; i++) {
      const char = configString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Report progress to callback
   */
  private reportProgress(progress: Parameters<BatchProgressCallback>[0]): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Create a batch runner with default configuration
   */
  static createDefault(): ConfigBalancerBatchRunner {
    const defaultConfig: BatchConfig = {
      id: 'default-batch',
      name: 'Default Stress Test Batch',
      description: 'Default batch configuration for stress testing',
      scenarios: [],
      execution: {
        mode: 'sequential',
        maxParallel: 2,
        continueOnFailure: true,
        stopOnFailure: false,
        scenarioTimeoutMinutes: 30,
        batchTimeoutMinutes: 120,
      },
      reporting: {
        enableSummaryReport: true,
        enableDetailedReports: true,
        enableComparisonReport: true,
        outputDir: './data/stressTesting/batch-results',
        formats: ['json', 'csv'],
      },
      metadata: {
        createdBy: 'ConfigBalancerBatchRunner',
        createdAt: new Date().toISOString(),
        environment: 'development',
      },
    };

    return new ConfigBalancerBatchRunner(defaultConfig);
  }
}
