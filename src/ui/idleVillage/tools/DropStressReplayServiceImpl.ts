/**
 * Drop Stress Replay Service for Idle Village Phase E validation testing.
 * 
 * This service provides the core functionality for stress testing the drop
 * validation system by replaying thousands of scenarios and comparing results
 * with expected outcomes.
 */

import { performance } from 'perf_hooks';
import type { 
  DropScenario, 
  DropStressDataset,
  DropScenario as DropScenarioType 
} from './DropStressReplayService';
import { validateDropScenario, validateDropStressDataset } from './DropStressReplayService';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import { createDropValidator } from '@/ui/idleVillage/config/residentDropRules';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Configuration for replay operations
 */
export interface ReplayConfig {
  /** Maximum number of concurrent scenarios */
  concurrency: number;
  /** Whether to fail fast on first error */
  failFast: boolean;
  /** Timeout per scenario in milliseconds */
  timeoutMs: number;
  /** Whether to enable detailed logging */
  verbose: boolean;
}

/**
 * Result of a single scenario replay
 */
export interface ScenarioReplayResult {
  /** Scenario ID */
  scenarioId: string;
  /** Whether the replay was successful */
  success: boolean;
  /** Actual validation result */
  actualResult?: DropValidationResult;
  /** Expected validation result */
  expectedResult: DropValidationResult;
  /** Whether results match */
  matches: boolean;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error message if failed */
  error?: string;
}

/**
 * Overall replay results with KPIs
 */
export interface ReplayResults {
  /** Total scenarios processed */
  totalScenarios: number;
  /** Successful replays */
  successfulReplays: number;
  /** Failed replays */
  failedReplays: number;
  /** Matching results */
  matchingResults: number;
  /** Mismatching results */
  mismatchingResults: number;
  /** Overall accuracy rate */
  accuracyRate: number;
  /** Average execution time */
  avgExecutionTimeMs: number;
  /** Maximum execution time */
  maxExecutionTimeMs: number;
  /** Minimum execution time */
  minExecutionTimeMs: number;
  /** Individual scenario results */
  scenarioResults: ScenarioReplayResult[];
  /** Performance KPIs */
  performanceKPIs: {
    /** Total execution time */
    totalTimeMs: number;
    /** Scenarios per second */
    scenariosPerSecond: number;
    /** Memory usage estimate */
    memoryUsageMB: number;
  };
}

/**
 * Drop Stress Replay Service class
 */
export class DropStressReplayServiceClass {
  private config: ReplayConfig;
  private validator: ReturnType<typeof createDropValidator>;

  constructor(config: Partial<ReplayConfig> = {}) {
    this.config = {
      concurrency: config.concurrency || 10,
      failFast: config.failFast || false,
      timeoutMs: config.timeoutMs || 5000,
      verbose: config.verbose || false,
    };
    
    this.validator = createDropValidator();
  }

  /**
   * Validate and load a dataset
   */
  async loadDataset(datasetPath: string): Promise<DropStressDataset> {
    try {
      // In a real implementation, this would read from file
      // For now, we'll simulate dataset loading
      const dataset = await this.mockLoadDataset(datasetPath);
      return validateDropStressDataset(dataset);
    } catch (error) {
      throw new Error(`Failed to load dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Replay a single scenario
   */
  async replayScenario(scenario: DropScenarioType): Promise<ScenarioReplayResult> {
    const startTime = performance.now();
    
    try {
      // Convert scenario to validation parameters
      const validationResult = await this.executeValidation(scenario);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Compare with expected result
      const matches = this.compareResults(validationResult, scenario.expectedVerdict);

      return {
        scenarioId: scenario.id,
        success: true,
        actualResult: validationResult,
        expectedResult: scenario.expectedVerdict,
        matches,
        executionTimeMs: executionTime,
      };
    } catch (error) {
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      return {
        scenarioId: scenario.id,
        success: false,
        expectedResult: scenario.expectedVerdict,
        matches: false,
        executionTimeMs: executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Replay all scenarios in a dataset
   */
  async replayDataset(dataset: DropStressDataset): Promise<ReplayResults> {
    const startTime = performance.now();
    const scenarioResults: ScenarioReplayResult[] = [];

    // Process scenarios in batches based on concurrency
    const batches = this.createBatches(dataset.scenarios, this.config.concurrency);
    
    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(scenario => this.replayScenario(scenario))
      );

      scenarioResults.push(...batchResults);

      // Check for failures if failFast is enabled
      if (this.config.failFast) {
        const failedInBatch = batchResults.filter(result => !result.success);
        if (failedInBatch.length > 0) {
          if (this.config.verbose) {
            console.error(`Batch failed with ${failedInBatch.length} errors`);
          }
          break;
        }
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    return this.calculateResults(scenarioResults, totalTime);
  }

  /**
   * Execute validation for a scenario
   */
  private async executeValidation(scenario: DropScenarioType): Promise<DropValidationResult> {
    // Convert scenario data to validation format
    const resident = this.convertToResidentState(scenario.residentStats);
    const activity = this.convertToActivityDefinition(scenario.slotInfo);

    // Use the KS-030 helper (validator) to get validation result
    return this.validator.validateDrop({
      resident,
      activity,
      currentOccupants: scenario.slotInfo.currentOccupants,
    });
  }

  /**
   * Compare actual and expected results
   */
  private compareResults(actual: DropValidationResult, expected: DropValidationResult): boolean {
    return actual.valid === expected.valid && 
           actual.reason === expected.reason &&
           Math.abs(actual.confidence - expected.confidence) < 0.01;
  }

  /**
   * Calculate overall results and KPIs
   */
  private calculateResults(scenarioResults: ScenarioReplayResult[], totalTimeMs: number): ReplayResults {
    const successfulReplays = scenarioResults.filter(r => r.success).length;
    const failedReplays = scenarioResults.filter(r => !r.success).length;
    const matchingResults = scenarioResults.filter(r => r.matches).length;
    const mismatchingResults = scenarioResults.filter(r => !r.matches).length;

    const executionTimes = scenarioResults.map(r => r.executionTimeMs);
    const avgExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
    const maxExecutionTime = Math.max(...executionTimes);
    const minExecutionTime = Math.min(...executionTimes);

    const accuracyRate = matchingResults / scenarioResults.length;
    const scenariosPerSecond = scenarioResults.length / (totalTimeMs / 1000);

    return {
      totalScenarios: scenarioResults.length,
      successfulReplays,
      failedReplays,
      matchingResults,
      mismatchingResults,
      accuracyRate,
      avgExecutionTimeMs: avgExecutionTime,
      maxExecutionTimeMs: maxExecutionTime,
      minExecutionTimeMs: minExecutionTime,
      scenarioResults,
      performanceKPIs: {
        totalTimeMs,
        scenariosPerSecond,
        memoryUsageMB: this.estimateMemoryUsage(),
      },
    };
  }

  /**
   * Create batches for concurrent processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Convert scenario resident stats to ResidentState
   */
  private convertToResidentState(stats: DropScenarioType['residentStats']): ResidentState {
    // Mock implementation - would convert to actual ResidentState format
    return {
      id: stats.id,
      name: stats.name,
      level: stats.level,
      stats: stats.stats,
      fatigue: stats.fatigue,
      tags: stats.tags,
    } as ResidentState;
  }

  /**
   * Convert scenario slot info to ActivityDefinition
   */
  private convertToActivityDefinition(slotInfo: DropScenarioType['slotInfo']): ActivityDefinition {
    // Mock implementation - would convert to actual ActivityDefinition format
    return {
      id: slotInfo.id,
      name: slotInfo.name,
      type: slotInfo.type,
      capacity: slotInfo.capacity,
      requirements: slotInfo.requirements,
    } as ActivityDefinition;
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    // Mock implementation - would use actual memory monitoring
    return Math.random() * 50 + 10; // 10-60 MB estimate
  }

  /**
   * Mock dataset loading (would read from file in real implementation)
   */
  private async mockLoadDataset(datasetPath: string): Promise<DropStressDataset> {
    // Return empty dataset for now
    return {
      metadata: {
        name: 'Mock Dataset',
        version: '1.0.0',
        description: 'Mock dataset for testing',
        totalScenarios: 0,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        tags: ['mock'],
      },
      scenarios: [],
      benchmarks: {
        maxLatencyMs: 100,
        minAccuracyRate: 0.95,
        maxMemoryUsageMB: 50,
      },
    };
  }
}

/**
 * Default replay service instance
 */
export const defaultDropStressReplayService = new DropStressReplayServiceClass();

/**
 * Helper function to create a replay service with custom config
 */
export const createDropStressReplayService = (config: Partial<ReplayConfig> = {}) => {
  return new DropStressReplayServiceClass(config);
};
