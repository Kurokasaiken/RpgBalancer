/**
 * NP-095 – Versioned Stress Test Scenarios
 *
 * Config-first versioned scenario definitions for stress testing.
 * Provides predefined scenarios with versioning for reproducible batch testing.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import type { VersionedScenario, BatchConfig } from './ConfigBalancerBatchRunner';

/**
 * Predefined stress test scenarios with versioning
 */
export const VERSIONED_SCENARIOS: Record<string, VersionedScenario> = {
  // Quick validation scenarios (v1.0)
  'quick-validation-v1.0': {
    id: 'quick-validation',
    version: '1.0',
    name: 'Quick Validation',
    description: 'Fast validation scenario with minimal iterations for quick feedback',
    tags: ['validation', 'quick', 'smoke-test'],
    estimatedRuntimeMinutes: 2,
    priority: 10,
    runnerConfig: {
      archetypeGen: {
        seed: 42,
        includeDerivedStats: false,
        maxArchetypes: 10,
      },
      marginalUtility: {
        iterations: 500,
        seed: 42,
        parallelJobs: 2,
        opThreshold: 1.15,
        weakThreshold: 0.95,
      },
      export: {
        enableJson: true,
        enableCsv: false,
        enableMarkdown: false,
        outputPath: './data/stressTesting/scenarios/quick-validation',
      },
      enableProgress: true,
      enableCaching: false,
    },
  },

  // Standard analysis scenarios (v1.0)
  'standard-analysis-v1.0': {
    id: 'standard-analysis',
    version: '1.0',
    name: 'Standard Analysis',
    description: 'Balanced analysis scenario for comprehensive marginal utility testing',
    tags: ['analysis', 'standard', 'balanced'],
    estimatedRuntimeMinutes: 15,
    priority: 8,
    runnerConfig: {
      archetypeGen: {
        seed: 1337,
        includeDerivedStats: false,
        maxArchetypes: 50,
      },
      marginalUtility: {
        iterations: 5000,
        seed: 1337,
        parallelJobs: 4,
        opThreshold: 1.15,
        weakThreshold: 0.95,
      },
      export: {
        enableJson: true,
        enableCsv: true,
        enableMarkdown: false,
        outputPath: './data/stressTesting/scenarios/standard-analysis',
      },
      enableProgress: true,
      enableCaching: true,
    },
  },

  // Comprehensive analysis scenarios (v1.0)
  'comprehensive-analysis-v1.0': {
    id: 'comprehensive-analysis',
    version: '1.0',
    name: 'Comprehensive Analysis',
    description: 'Thorough analysis with high iteration count for detailed marginal utility insights',
    tags: ['analysis', 'comprehensive', 'detailed'],
    estimatedRuntimeMinutes: 45,
    priority: 6,
    runnerConfig: {
      archetypeGen: {
        seed: 9999,
        includeDerivedStats: true,
        maxArchetypes: 100,
      },
      marginalUtility: {
        iterations: 25000,
        seed: 9999,
        parallelJobs: 6,
        opThreshold: 1.15,
        weakThreshold: 0.95,
      },
      export: {
        enableJson: true,
        enableCsv: true,
        enableMarkdown: true,
        outputPath: './data/stressTesting/scenarios/comprehensive-analysis',
      },
      enableProgress: true,
      enableCaching: true,
    },
  },

  // Performance benchmark scenarios (v1.0)
  'performance-benchmark-v1.0': {
    id: 'performance-benchmark',
    version: '1.0',
    name: 'Performance Benchmark',
    description: 'High-throughput scenario optimized for performance measurement',
    tags: ['performance', 'benchmark', 'throughput'],
    estimatedRuntimeMinutes: 25,
    priority: 7,
    runnerConfig: {
      archetypeGen: {
        seed: 3141,
        includeDerivedStats: false,
        maxArchetypes: 75,
      },
      marginalUtility: {
        iterations: 15000,
        seed: 3141,
        parallelJobs: 8,
        opThreshold: 1.15,
        weakThreshold: 0.95,
      },
      export: {
        enableJson: true,
        enableCsv: false,
        enableMarkdown: false,
        outputPath: './data/stressTesting/scenarios/performance-benchmark',
      },
      enableProgress: true,
      enableCaching: false,
    },
  },

  // Edge case testing scenarios (v1.0)
  'edge-case-testing-v1.0': {
    id: 'edge-case-testing',
    version: '1.0',
    name: 'Edge Case Testing',
    description: 'Focused testing of edge cases and boundary conditions',
    tags: ['edge-case', 'boundary', 'validation'],
    estimatedRuntimeMinutes: 10,
    priority: 9,
    runnerConfig: {
      archetypeGen: {
        seed: 7777,
        includeDerivedStats: true,
        maxArchetypes: 25,
      },
      marginalUtility: {
        iterations: 2000,
        seed: 7777,
        parallelJobs: 3,
        opThreshold: 1.20, // Higher threshold for edge cases
        weakThreshold: 0.90, // Lower threshold for edge cases
      },
      export: {
        enableJson: true,
        enableCsv: true,
        enableMarkdown: false,
        outputPath: './data/stressTesting/scenarios/edge-case-testing',
      },
      enableProgress: true,
      enableCaching: true,
    },
  },

  // Regression testing scenarios (v1.0)
  'regression-testing-v1.0': {
    id: 'regression-testing',
    version: '1.0',
    name: 'Regression Testing',
    description: 'Stable scenario for detecting regressions in marginal utility calculations',
    tags: ['regression', 'stable', 'baseline'],
    estimatedRuntimeMinutes: 20,
    priority: 5,
    runnerConfig: {
      archetypeGen: {
        seed: 12345, // Fixed seed for reproducibility
        includeDerivedStats: false,
        maxArchetypes: 40,
      },
      marginalUtility: {
        iterations: 8000,
        seed: 12345, // Fixed seed for reproducibility
        parallelJobs: 4,
        opThreshold: 1.15,
        weakThreshold: 0.95,
      },
      export: {
        enableJson: true,
        enableCsv: true,
        enableMarkdown: true,
        outputPath: './data/stressTesting/scenarios/regression-testing',
      },
      enableProgress: true,
      enableCaching: true,
    },
  },
};

/**
 * Scenario collection presets
 */
export const SCENARIO_PRESETS = {
  /** Quick validation suite for CI/CD */
  ci: {
    name: 'CI Validation Suite',
    description: 'Fast scenarios for continuous integration validation',
    scenarios: [
      VERSIONED_SCENARIOS['quick-validation-v1.0'],
    ],
  },

  /** Standard analysis suite */
  standard: {
    name: 'Standard Analysis Suite',
    description: 'Balanced scenarios for regular analysis',
    scenarios: [
      VERSIONED_SCENARIOS['quick-validation-v1.0'],
      VERSIONED_SCENARIOS['standard-analysis-v1.0'],
    ],
  },

  /** Comprehensive analysis suite */
  comprehensive: {
    name: 'Comprehensive Analysis Suite',
    description: 'Thorough analysis for detailed insights',
    scenarios: [
      VERSIONED_SCENARIOS['quick-validation-v1.0'],
      VERSIONED_SCENARIOS['standard-analysis-v1.0'],
      VERSIONED_SCENARIOS['performance-benchmark-v1.0'],
      VERSIONED_SCENARIOS['edge-case-testing-v1.0'],
    ],
  },

  /** Regression testing suite */
  regression: {
    name: 'Regression Testing Suite',
    description: 'Stable scenarios for regression detection',
    scenarios: [
      VERSIONED_SCENARIOS['regression-testing-v1.0'],
    ],
  },

  /** Performance-focused suite */
  performance: {
    name: 'Performance Testing Suite',
    description: 'High-throughput scenarios for performance analysis',
    scenarios: [
      VERSIONED_SCENARIOS['performance-benchmark-v1.0'],
      VERSIONED_SCENARIOS['quick-validation-v1.0'],
    ],
  },
};

/**
 * Create a batch configuration from a preset
 */
export function createBatchFromPreset(
  presetName: keyof typeof SCENARIO_PRESETS,
  options: {
    batchId?: string;
    executionMode?: 'sequential' | 'parallel';
    environment?: string;
    outputDir?: string;
  } = {}
): BatchConfig {
  const preset = SCENARIO_PRESETS[presetName];

  return {
    id: options.batchId || `${presetName}-batch-${Date.now()}`,
    name: preset.name,
    description: preset.description,
    scenarios: preset.scenarios,
    execution: {
      mode: options.executionMode || 'sequential',
      maxParallel: 2,
      continueOnFailure: true,
      stopOnFailure: false,
      scenarioTimeoutMinutes: Math.max(...preset.scenarios.map(s => s.estimatedRuntimeMinutes)) + 5,
      batchTimeoutMinutes: preset.scenarios.reduce((sum, s) => sum + s.estimatedRuntimeMinutes, 0) + 10,
    },
    reporting: {
      enableSummaryReport: true,
      enableDetailedReports: true,
      enableComparisonReport: true,
      outputDir: options.outputDir || `./data/stressTesting/batch-results/${presetName}`,
      formats: ['json', 'csv', 'markdown'],
    },
    metadata: {
      createdBy: 'VersionedScenarios',
      createdAt: new Date().toISOString(),
      environment: options.environment || 'development',
    },
  };
}

/**
 * Create a custom batch configuration
 */
export function createCustomBatch(
  scenarios: VersionedScenario[],
  options: {
    batchId: string;
    batchName: string;
    batchDescription: string;
    executionMode?: 'sequential' | 'parallel';
    maxParallel?: number;
    environment?: string;
    outputDir?: string;
  }
): BatchConfig {
  return {
    id: options.batchId,
    name: options.batchName,
    description: options.batchDescription,
    scenarios,
    execution: {
      mode: options.executionMode || 'sequential',
      maxParallel: options.maxParallel || 2,
      continueOnFailure: true,
      stopOnFailure: false,
      scenarioTimeoutMinutes: Math.max(...scenarios.map(s => s.estimatedRuntimeMinutes)) + 5,
      batchTimeoutMinutes: scenarios.reduce((sum, s) => sum + s.estimatedRuntimeMinutes, 0) + 10,
    },
    reporting: {
      enableSummaryReport: true,
      enableDetailedReports: true,
      enableComparisonReport: true,
      outputDir: options.outputDir || `./data/stressTesting/batch-results/${options.batchId}`,
      formats: ['json', 'csv', 'markdown'],
    },
    metadata: {
      createdBy: 'CustomBatch',
      createdAt: new Date().toISOString(),
      environment: options.environment || 'development',
    },
  };
}

/**
 * Get all available scenario versions
 */
export function getAvailableScenarios(): VersionedScenario[] {
  return Object.values(VERSIONED_SCENARIOS);
}

/**
 * Find scenarios by tags
 */
export function findScenariosByTags(tags: string[]): VersionedScenario[] {
  return Object.values(VERSIONED_SCENARIOS).filter(scenario =>
    tags.some(tag => scenario.tags.includes(tag))
  );
}

/**
 * Get scenario by ID and version
 */
export function getScenarioByIdAndVersion(id: string, version: string): VersionedScenario | null {
  const key = `${id}-${version}`;
  return VERSIONED_SCENARIOS[key] || null;
}

/**
 * Get latest version of a scenario by ID
 */
export function getLatestScenarioVersion(id: string): VersionedScenario | null {
  const matchingScenarios = Object.values(VERSIONED_SCENARIOS)
    .filter(scenario => scenario.id === id)
    .sort((a, b) => b.version.localeCompare(a.version));

  return matchingScenarios[0] || null;
}

/**
 * Validate scenario configuration
 */
export function validateScenario(scenario: VersionedScenario): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!scenario.id || scenario.id.trim().length === 0) {
    errors.push('Scenario ID is required');
  }

  if (!scenario.version || scenario.version.trim().length === 0) {
    errors.push('Scenario version is required');
  }

  if (!scenario.name || scenario.name.trim().length === 0) {
    errors.push('Scenario name is required');
  }

  if (!scenario.runnerConfig) {
    errors.push('Runner configuration is required');
  } else {
    if (scenario.runnerConfig.archetypeGen.maxArchetypes <= 0) {
      errors.push('Max archetypes must be greater than 0');
    }
    if (scenario.runnerConfig.marginalUtility.iterations <= 0) {
      errors.push('Iterations must be greater than 0');
    }
  }

  if (scenario.estimatedRuntimeMinutes <= 0) {
    errors.push('Estimated runtime must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate batch configuration
 */
export function validateBatchConfig(config: BatchConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.id || config.id.trim().length === 0) {
    errors.push('Batch ID is required');
  }

  if (!config.name || config.name.trim().length === 0) {
    errors.push('Batch name is required');
  }

  if (!config.scenarios || config.scenarios.length === 0) {
    errors.push('At least one scenario is required');
  } else {
    config.scenarios.forEach((scenario, index) => {
      const validation = validateScenario(scenario);
      if (!validation.valid) {
        errors.push(`Scenario ${index} (${scenario.id}): ${validation.errors.join(', ')}`);
      }
    });
  }

  if (!config.execution) {
    errors.push('Execution configuration is required');
  } else {
    if (config.execution.scenarioTimeoutMinutes <= 0) {
      errors.push('Scenario timeout must be greater than 0');
    }
    if (config.execution.batchTimeoutMinutes <= 0) {
      errors.push('Batch timeout must be greater than 0');
    }
    if (config.execution.maxParallel <= 0) {
      errors.push('Max parallel executions must be greater than 0');
    }
  }

  if (!config.reporting) {
    errors.push('Reporting configuration is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
