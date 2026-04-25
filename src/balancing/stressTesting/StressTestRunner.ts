/**
 * Stress Test Runner
 * 
 * High-level orchestrator for stress testing pipeline.
 * Coordinates archetype generation, marginal utility analysis, and result export.
 * 
 * @module StressTestRunner
 * @since 2026-01-11
 * @author Vector-Marginal
 */

import { StressTestArchetypeGenerator } from './StressTestArchetypeGenerator';
import { MarginalUtilityCalculator } from './MarginalUtilityCalculator';
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';
import { saveData } from '@/shared/persistence/PersistenceService';
import type { StressTestArchetype } from './types';
import type { MarginalUtilityAnalysis } from './MarginalUtilityTypes';
import type { StressTestConfig } from './types';

/**
 * Complete stress testing pipeline configuration
 */
export interface StressTestRunnerConfig {
  /** Archetype generation parameters */
  archetypeGen: {
    seed: number;
    includeDerivedStats: boolean;
    maxArchetypes: number;
  };
  /** Marginal utility analysis parameters */
  marginalUtility: {
    iterations: number;
    seed: number;
    parallelJobs: number;
    opThreshold: number;
    weakThreshold: number;
  };
  /** Export configuration */
  export: {
    enableJson: boolean;
    enableCsv: boolean;
    enableMarkdown: boolean;
    outputPath: string;
  };
  /** Progress reporting */
  enableProgress: boolean;
  /** Caching */
  enableCaching: boolean;
}

/**
 * Stress testing pipeline results
 */
export interface StressTestResults {
  /** Generated archetypes */
  archetypes: StressTestArchetype[];
  /** Marginal utility analysis */
  analysis: MarginalUtilityAnalysis;
  /** Pipeline configuration */
  config: StressTestRunnerConfig;
  /** Execution metadata */
  metadata: {
    runId: string;
    startTime: number;
    endTime: number;
    durationMs: number;
    balancerConfigHash: string;
  };
}

/**
 * Progress reporting interface
 */
export interface StressTestProgress {
  /** Current stage */
  stage: 'archetype-generation' | 'marginal-analysis' | 'export' | 'completed';
  /** Progress percentage (0-100) */
  progress: number;
  /** Current operation description */
  description: string;
  /** Estimated remaining time (ms) */
  estimatedTimeRemaining?: number;
}

/**
 * High-level stress testing orchestrator
 */
export class StressTestRunner {
  private config: StressTestRunnerConfig;
  private progressCallback?: (progress: StressTestProgress) => void;

  constructor(config: Partial<StressTestRunnerConfig> = {}) {
    // Default configuration
    this.config = {
      archetypeGen: {
        seed: 42,
        includeDerivedStats: false,
        maxArchetypes: 100,
      },
      marginalUtility: {
        iterations: 10000,
        seed: 42,
        parallelJobs: 4,
        opThreshold: 1.15,
        weakThreshold: 0.95,
      },
      export: {
        enableJson: true,
        enableCsv: true,
        enableMarkdown: false,
        outputPath: './data/stressTesting/results',
      },
      enableProgress: true,
      enableCaching: true,
      ...config,
    };
  }

  /**
   * Set progress callback for long-running operations
   */
  setProgressCallback(callback: (progress: StressTestProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Run complete stress testing pipeline
   */
  async runStressTest(): Promise<StressTestResults> {
    const startTime = Date.now();
    const runId = `stress-test-${this.config.archetypeGen.seed}-${startTime}`;
    
    this.reportProgress({
      stage: 'archetype-generation',
      progress: 0,
      description: 'Loading balancer configuration...',
    });

    // Load balancer configuration
    const balancerConfig = await BalancerConfigStore.load();
    const balancerConfigHash = this.generateConfigHash(balancerConfig);

    // Step 1: Generate archetypes
    this.reportProgress({
      stage: 'archetype-generation',
      progress: 10,
      description: 'Generating stress test archetypes...',
    });

    const generator = new StressTestArchetypeGenerator({
      seed: this.config.archetypeGen.seed,
      includeDerivedStats: this.config.archetypeGen.includeDerivedStats,
      maxArchetypes: this.config.archetypeGen.maxArchetypes,
    });

    const archetypes = generator.generateArchetypes(balancerConfig);

    this.reportProgress({
      stage: 'archetype-generation',
      progress: 40,
      description: `Generated ${archetypes.length} archetypes`,
    });

    // Step 2: Run marginal utility analysis
    this.reportProgress({
      stage: 'marginal-analysis',
      progress: 50,
      description: 'Calculating marginal utility...',
    });

    const calculator = new MarginalUtilityCalculator({
      simulationCount: this.config.marginalUtility.iterations,
      seed: this.config.marginalUtility.seed,
      concurrencyLimit: this.config.marginalUtility.parallelJobs,
      opThreshold: this.config.marginalUtility.opThreshold,
      weakThreshold: this.config.marginalUtility.weakThreshold,
      enableCaching: this.config.enableCaching,
    });

    // Set up progress callback for calculator
    if (this.config.enableProgress && this.progressCallback) {
      calculator.setProgressCallback((progress) => {
        this.reportProgress({
          stage: 'marginal-analysis',
          progress: 50 + (progress.progress * 0.4), // 50-90% range
          description: progress.description,
          estimatedTimeRemaining: progress.estimatedTimeRemaining,
        });
      });
    }

    const analysis = await calculator.runAnalysis(archetypes, archetypes[0]); // Use first archetype as baseline

    this.reportProgress({
      stage: 'marginal-analysis',
      progress: 90,
      description: 'Analysis completed',
    });

    // Step 3: Export results
    this.reportProgress({
      stage: 'export',
      progress: 95,
      description: 'Exporting results...',
    });

    await this.exportResults(analysis, runId);

    // Compile final results
    const endTime = Date.now();
    const results: StressTestResults = {
      archetypes,
      analysis,
      config: this.config,
      metadata: {
        runId,
        startTime,
        endTime,
        durationMs: endTime - startTime,
        balancerConfigHash,
      },
    };

    // Save results if caching enabled
    if (this.config.enableCaching) {
      await this.saveResults(results);
    }

    this.reportProgress({
      stage: 'completed',
      progress: 100,
      description: `Stress test completed in ${((endTime - startTime) / 1000).toFixed(1)}s`,
    });

    return results;
  }

  /**
   * Export analysis results to configured formats
   */
  private async exportResults(analysis: MarginalUtilityAnalysis, runId: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `${runId}-${timestamp}`;

    // Export JSON
    if (this.config.export.enableJson) {
      const jsonPath = `${this.config.export.outputPath}/${baseFilename}.json`;
      await saveData(jsonPath, analysis);
    }

    // Export CSV
    if (this.config.export.enableCsv) {
      const csvPath = `${this.config.export.outputPath}/${baseFilename}.csv`;
      const csvData = this.convertToCSV(analysis);
      await saveData(csvPath, csvData);
    }

    // Export Markdown
    if (this.config.export.enableMarkdown) {
      const mdPath = `${this.config.export.outputPath}/${baseFilename}.md`;
      const mdData = this.convertToMarkdown(analysis);
      await saveData(mdPath, mdData);
    }
  }

  /**
   * Convert analysis results to CSV format
   */
  private convertToCSV(analysis: MarginalUtilityAnalysis): string {
    const headers = [
      'Pair ID',
      'Stat A',
      'Stat B',
      'Win Rate A',
      'Win Rate B',
      'Synergy Multiplier',
      'Is OP Synergy',
      'Is Weak Synergy',
      'Is Significant',
      'Avg Turns',
      'Avg HP Remaining',
      'Avg Damage Dealt',
    ];

    const rows = analysis.synergyAnalyses.map(pair => [
      pair.pairId,
      pair.statIds[0],
      pair.statIds[1],
      pair.winRateA.toFixed(4),
      (1 - pair.winRateA).toFixed(4),
      pair.synergyMultiplier.toFixed(4),
      pair.isOpSynergy ? 'Yes' : 'No',
      pair.isWeakSynergy ? 'Yes' : 'No',
      pair.isSignificant ? 'Yes' : 'No',
      pair.avgTurns.toFixed(2),
      pair.avgHpRemaining.toFixed(2),
      pair.avgDamageDealt.toFixed(2),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert analysis results to Markdown format
   */
  private convertToMarkdown(analysis: MarginalUtilityAnalysis): string {
    const { summary, synergyAnalyses } = analysis;

    let markdown = `# Stress Test Analysis Results

**Run ID:** ${analysis.id}  
**Date:** ${new Date(analysis.timestamp).toLocaleString()}  
**Duration:** ${(summary.totalRuntimeMs / 1000).toFixed(1)}s  

## Summary

- **Total Simulations:** ${summary.totalSimulations.toLocaleString()}
- **Simulations/Second:** ${summary.avgSimulationsPerSecond.toLocaleString()}
- **OP Synergies:** ${summary.opSynergiesCount}
- **Weak Synergies:** ${summary.weakSynergiesCount}
- **Significant Synergies:** ${summary.significantSynergiesCount}

## Configuration

- **Simulation Count:** ${analysis.config.simulationCount}
- **Seed:** ${analysis.config.seed}
- **OP Threshold:** ${analysis.config.thresholds.opThreshold}
- **Weak Threshold:** ${analysis.config.thresholds.weakThreshold}

## Top Synergies

| Stat Pair | Multiplier | Win Rate A | Win Rate B | Avg Turns |
|-----------|-------------|------------|------------|-----------|
`;

    // Add top 10 synergies
    const topSynergies = synergyAnalyses
      .filter(s => s.isOpSynergy)
      .sort((a, b) => b.synergyMultiplier - a.synergyMultiplier)
      .slice(0, 10);

    for (const synergy of topSynergies) {
      markdown += `| ${synergy.statIds.join(' + ')} | ${synergy.synergyMultiplier.toFixed(3)} | ${(synergy.winRateA * 100).toFixed(1)}% | ${((1 - synergy.winRateA) * 100).toFixed(1)}% | ${synergy.avgTurns.toFixed(1)} |\n`;
    }

    markdown += `\n## Weak Synergies

| Stat Pair | Multiplier | Win Rate A | Win Rate B | Avg Turns |
|-----------|-------------|------------|------------|-----------|
`;

    // Add top 10 weak synergies
    const weakSynergies = synergyAnalyses
      .filter(s => s.isWeakSynergy)
      .sort((a, b) => a.synergyMultiplier - b.synergyMultiplier)
      .slice(0, 10);

    for (const synergy of weakSynergies) {
      markdown += `| ${synergy.statIds.join(' + ')} | ${synergy.synergyMultiplier.toFixed(3)} | ${(synergy.winRateA * 100).toFixed(1)}% | ${((1 - synergy.winRateA) * 100).toFixed(1)}% | ${synergy.avgTurns.toFixed(1)} |\n`;
    }

    return markdown;
  }

  /**
   * Generate configuration hash for caching
   */
  private generateConfigHash(balancerConfig: any): string {
    const configString = JSON.stringify({
      runnerConfig: this.config,
      balancerConfig,
    });
    
    // Simple hash function (in production, use crypto)
    let hash = 0;
    for (let i = 0; i < configString.length; i++) {
      const char = configString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Save results to cache
   */
  private async saveResults(results: StressTestResults): Promise<void> {
    const cachePath = `data/stressTesting/cache/${results.metadata.runId}.json`;
    await saveData(cachePath, results);
  }

  /**
   * Report progress to callback
   */
  private reportProgress(progress: StressTestProgress): void {
    if (this.config.enableProgress && this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Get estimated completion time for current stage
   */
  private getEstimatedTimeRemaining(stage: string, progress: number): number {
    // Rough estimates based on typical performance
    const stageEstimates = {
      'archetype-generation': 30000, // 30 seconds
      'marginal-analysis': 300000, // 5 minutes
      'export': 5000, // 5 seconds
    };

    const estimate = stageEstimates[stage as keyof typeof stageEstimates] || 60000;
    return Math.round((estimate * (100 - progress)) / 100);
  }

  /**
   * Create a runner with default configuration
   */
  static createDefault(): StressTestRunner {
    return new StressTestRunner();
  }

  /**
   * Create a runner for quick testing
   */
  static createQuick(): StressTestRunner {
    return new StressTestRunner({
      archetypeGen: {
        seed: 42,
        includeDerivedStats: false,
        maxArchetypes: 20,
      },
      marginalUtility: {
        iterations: 1000,
        seed: 42,
        parallelJobs: 2,
        opThreshold: 1.15,
        weakThreshold: 0.95,
      },
      export: {
        enableJson: true,
        enableCsv: false,
        enableMarkdown: false,
        outputPath: './data/stressTesting/quick-results',
      },
      enableProgress: true,
      enableCaching: false,
    });
  }

  /**
   * Create a runner for production analysis
   */
  static createProduction(): StressTestRunner {
    return new StressTestRunner({
      archetypeGen: {
        seed: 42,
        includeDerivedStats: false,
        maxArchetypes: 200,
      },
      marginalUtility: {
        iterations: 50000,
        seed: 42,
        parallelJobs: 8,
        opThreshold: 1.15,
        weakThreshold: 0.95,
      },
      export: {
        enableJson: true,
        enableCsv: true,
        enableMarkdown: true,
        outputPath: './data/stressTesting/production-results',
      },
      enableProgress: true,
      enableCaching: true,
    });
  }
}
