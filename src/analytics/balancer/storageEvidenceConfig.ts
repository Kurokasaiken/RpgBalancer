import { z } from 'zod';

/**
 * Configuration schema for Balancer Storage Integrity Evidence CLI
 * Defines targets, thresholds, and execution parameters for storage testing
 */

export const StorageEvidenceTargetSchema = z.object({
  /** Storage system identifier (e.g., 'balancer-config', 'spell-storage') */
  id: z.string(),
  /** Human-readable name for the storage system */
  name: z.string(),
  /** Storage adapter implementation */
  adapter: z.any(), // Storage adapter type
  /** Test data to use for validation */
  testData: z.any(),
  /** Alternative test data for comparison testing */
  alternateData: z.any().optional(),
  /** Priority for execution (lower = higher priority) */
  priority: z.number().default(1),
  /** Whether this target should be included in evidence collection */
  enabled: z.boolean().default(true),
});

export type StorageEvidenceTarget = z.infer<typeof StorageEvidenceTargetSchema>;

export const StorageEvidenceThresholdsSchema = z.object({
  /** Maximum allowed execution time per test (ms) */
  maxExecutionTime: z.number().default(5000),
  /** Minimum success rate required (0-1) */
  minSuccessRate: z.number().default(0.95),
  /** Maximum allowed failures per test suite */
  maxFailures: z.number().default(3),
  /** Maximum memory usage threshold (MB) */
  maxMemoryUsage: z.number().default(100),
  /** Performance regression threshold (%) */
  performanceRegressionThreshold: z.number().default(10),
  /** Data integrity threshold (0-1) */
  dataIntegrityThreshold: z.number().default(1.0),
});

export type StorageEvidenceThresholds = z.infer<typeof StorageEvidenceThresholdsSchema>;

export const StorageEvidenceExecutionSchema = z.object({
  /** Number of retry attempts for failed tests */
  maxRetries: z.number().default(3),
  /** Delay between retries (ms) */
  retryDelay: z.number().default(1000),
  /** Whether to run tests in parallel */
  parallelExecution: z.boolean().default(true),
  /** Maximum concurrent operations */
  maxConcurrentOps: z.number().default(5),
  /** Timeout for entire execution (ms) */
  totalTimeout: z.number().default(60000),
  /** Whether to continue on first failure */
  continueOnFailure: z.boolean().default(false),
  /** Verbose logging output */
  verbose: z.boolean().default(false),
});

export type StorageEvidenceExecution = z.infer<typeof StorageEvidenceExecutionSchema>;

export const StorageEvidenceOutputSchema = z.object({
  /** Output directory for evidence files */
  outputDir: z.string().default('test-results'),
  /** Whether to create timestamped filenames */
  createTimestampedFilenames: z.boolean().default(true),
  /** Output formats to generate */
  formats: z.array(z.enum(['json', 'markdown', 'csv'])).default(['json', 'markdown']),
  /** Whether to include detailed test results */
  includeDetailedResults: z.boolean().default(true),
  /** Whether to include performance metrics */
  includePerformanceMetrics: z.boolean().default(true),
  /** Whether to include raw logs */
  includeRawLogs: z.boolean().default(false),
});

export type StorageEvidenceOutput = z.infer<typeof StorageEvidenceOutputSchema>;

export const StorageEvidenceConfigSchema = z.object({
  /** Configuration name and description */
  name: z.string(),
  description: z.string(),
  /** Storage targets to test */
  targets: z.array(StorageEvidenceTargetSchema),
  /** Execution parameters */
  execution: StorageEvidenceExecutionSchema,
  /** Quality thresholds */
  thresholds: StorageEvidenceThresholdsSchema,
  /** Output configuration */
  output: StorageEvidenceOutputSchema,
  /** Metadata */
  version: z.string().default('1.0.0'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type StorageEvidenceConfig = z.infer<typeof StorageEvidenceConfigSchema>;

/**
 * Default configuration for Balancer Storage Integrity Evidence CLI
 */
export const DEFAULT_STORAGE_EVIDENCE_CONFIG: StorageEvidenceConfig = {
  name: 'Balancer Storage Integrity Evidence',
  description: 'Comprehensive storage testing evidence collection for Balancer systems',
  targets: [
    {
      id: 'balancer-config',
      name: 'Balancer Configuration Store',
      adapter: null, // Will be set at runtime
      testData: { testKey: 'testValue', timestamp: Date.now() },
      alternateData: { testKey: 'alternateValue', timestamp: Date.now() + 1000 },
      priority: 1,
      enabled: true,
    },
    {
      id: 'spell-storage',
      name: 'Spell Storage System',
      adapter: null, // Will be set at runtime
      testData: { spellId: 'test-spell', power: 100, type: 'fire' },
      alternateData: { spellId: 'test-spell', power: 150, type: 'ice' },
      priority: 2,
      enabled: true,
    },
    {
      id: 'preset-storage',
      name: 'Preset Storage System',
      adapter: null, // Will be set at runtime
      testData: { presetId: 'test-preset', name: 'Test Preset', active: true },
      alternateData: { presetId: 'test-preset', name: 'Updated Preset', active: false },
      priority: 3,
      enabled: true,
    },
  ],
  execution: {
    maxRetries: 3,
    retryDelay: 1000,
    parallelExecution: true,
    maxConcurrentOps: 5,
    totalTimeout: 60000,
    continueOnFailure: false,
    verbose: false,
  },
  thresholds: {
    maxExecutionTime: 5000,
    minSuccessRate: 0.95,
    maxFailures: 3,
    maxMemoryUsage: 100,
    performanceRegressionThreshold: 10,
    dataIntegrityThreshold: 1.0,
  },
  output: {
    outputDir: 'test-results',
    createTimestampedFilenames: true,
    formats: ['json', 'markdown', 'csv'],
    includeDetailedResults: true,
    includePerformanceMetrics: true,
    includeRawLogs: false,
  },
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Preset configurations for different testing scenarios
 */
export const STORAGE_EVIDENCE_PRESETS = {
  /** Quick validation for CI/CD pipelines */
  quick: {
    ...DEFAULT_STORAGE_EVIDENCE_CONFIG,
    name: 'Quick Storage Evidence',
    description: 'Fast validation for CI/CD pipelines',
    targets: DEFAULT_STORAGE_EVIDENCE_CONFIG.targets.slice(0, 1), // Only first target
    execution: {
      ...DEFAULT_STORAGE_EVIDENCE_CONFIG.execution,
      maxRetries: 1,
      parallelExecution: false,
      totalTimeout: 30000,
    },
    thresholds: {
      ...DEFAULT_STORAGE_EVIDENCE_CONFIG.thresholds,
      minSuccessRate: 0.9,
      maxFailures: 1,
    },
  },
  /** Comprehensive testing for release validation */
  comprehensive: {
    ...DEFAULT_STORAGE_EVIDENCE_CONFIG,
    name: 'Comprehensive Storage Evidence',
    description: 'Full validation suite for release testing',
    execution: {
      ...DEFAULT_STORAGE_EVIDENCE_CONFIG.execution,
      maxRetries: 5,
      verbose: true,
      totalTimeout: 120000,
    },
    thresholds: {
      ...DEFAULT_STORAGE_EVIDENCE_CONFIG.thresholds,
      minSuccessRate: 0.98,
      maxFailures: 0,
    },
  },
  /** Performance-focused testing */
  performance: {
    ...DEFAULT_STORAGE_EVIDENCE_CONFIG,
    name: 'Performance Storage Evidence',
    description: 'Performance and regression testing',
    thresholds: {
      ...DEFAULT_STORAGE_EVIDENCE_CONFIG.thresholds,
      maxExecutionTime: 2000,
      performanceRegressionThreshold: 5,
      maxMemoryUsage: 50,
    },
    output: {
      ...DEFAULT_STORAGE_EVIDENCE_CONFIG.output,
      includePerformanceMetrics: true,
      includeDetailedResults: false,
    },
  },
} as const;

export type StorageEvidencePreset = keyof typeof STORAGE_EVIDENCE_PRESETS;
