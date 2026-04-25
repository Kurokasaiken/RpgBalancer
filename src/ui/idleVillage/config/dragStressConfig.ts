import { z } from 'zod';

/**
 * Performance thresholds for drag stress testing
 */
export const PerformanceThresholdsSchema = z.object({
  maxTTI: z.number().min(1000).max(10000).describe('Maximum Time to Interactive in milliseconds'),
  maxDropLatency: z.number().min(10).max(1000).describe('Maximum drop feedback latency in milliseconds'),
  maxMemoryGrowth: z.number().min(50).max(500).describe('Maximum memory growth in MB'),
  maxCPUUsage: z.number().min(50).max(95).describe('Maximum CPU usage percentage'),
});

export type PerformanceThresholds = z.infer<typeof PerformanceThresholdsSchema>;

/**
 * Configuration for drag stress testing
 */
export const DragStressConfigSchema = z.object({
  batchSize: z.number().min(10).max(1000).describe('Number of batches to execute'),
  operationsPerBatch: z.number().min(100).max(10000).describe('Operations per batch'),
  cooldownMs: z.number().min(0).max(1000).describe('Cooldown between operations in milliseconds'),
  maxConcurrentDrags: z.number().min(1).max(20).describe('Maximum concurrent drag operations'),
  enableTelemetry: z.boolean().describe('Enable telemetry collection during stress test'),
  mockTimers: z.boolean().describe('Use fake timers for deterministic testing'),
  virtualizationThreshold: z.number().min(10).max(200).describe('Minimum items before enabling virtualization'),
  performanceThresholds: PerformanceThresholdsSchema.describe('Performance limits that trigger test failure'),
});

export type DragStressConfig = z.infer<typeof DragStressConfigSchema>;

/**
 * Default configuration for drag stress testing
 */
export const DEFAULT_DRAG_STRESS_CONFIG: DragStressConfig = {
  batchSize: 100,
  operationsPerBatch: 1000,
  cooldownMs: 50,
  maxConcurrentDrags: 5,
  enableTelemetry: true,
  mockTimers: true,
  virtualizationThreshold: 50,
  performanceThresholds: {
    maxTTI: 3000,
    maxDropLatency: 100,
    maxMemoryGrowth: 100,
    maxCPUUsage: 80,
  },
};

/**
 * Quick test configurations for different scenarios
 */
export const STRESS_PRESETS = {
  /** Quick smoke test - minimal operations */
  smoke: {
    ...DEFAULT_DRAG_STRESS_CONFIG,
    batchSize: 10,
    operationsPerBatch: 100,
    cooldownMs: 10,
  } satisfies DragStressConfig,

  /** Standard stress test - balanced performance */
  standard: {
    ...DEFAULT_DRAG_STRESS_CONFIG,
    batchSize: 50,
    operationsPerBatch: 500,
    cooldownMs: 25,
  } satisfies DragStressConfig,

  /** Heavy stress test - maximum load */
  heavy: {
    ...DEFAULT_DRAG_STRESS_CONFIG,
    batchSize: 200,
    operationsPerBatch: 2000,
    cooldownMs: 5,
    maxConcurrentDrags: 10,
  } satisfies DragStressConfig,

  /** Memory pressure test - focus on memory usage */
  memory: {
    ...DEFAULT_DRAG_STRESS_CONFIG,
    batchSize: 100,
    operationsPerBatch: 1500,
    cooldownMs: 0,
    performanceThresholds: {
      maxTTI: 5000,
      maxDropLatency: 200,
      maxMemoryGrowth: 200,
      maxCPUUsage: 90,
    },
  } satisfies DragStressConfig,

  /** Latency test - focus on response times */
  latency: {
    ...DEFAULT_DRAG_STRESS_CONFIG,
    batchSize: 25,
    operationsPerBatch: 200,
    cooldownMs: 100,
    performanceThresholds: {
      maxTTI: 2000,
      maxDropLatency: 50,
      maxMemoryGrowth: 50,
      maxCPUUsage: 70,
    },
  } satisfies DragStressConfig,
} as const;

/**
 * Get current drag stress configuration
 */
export function getDragStressConfig(): DragStressConfig {
  return DEFAULT_DRAG_STRESS_CONFIG;
}

/**
 * Get a specific preset configuration
 */
export function getStressPreset(preset: keyof typeof STRESS_PRESETS): DragStressConfig {
  return STRESS_PRESETS[preset];
}

/**
 * Validate drag stress configuration
 */
export function validateDragStressConfig(config: unknown): DragStressConfig {
  return DragStressConfigSchema.parse(config);
}

/**
 * Create custom drag stress configuration
 */
export function createDragStressConfig(overrides: Partial<DragStressConfig>): DragStressConfig {
  return DragStressConfigSchema.parse({
    ...DEFAULT_DRAG_STRESS_CONFIG,
    ...overrides,
  });
}

/**
 * Export configuration as JSON for external tools
 */
export function exportConfigAsJson(config: DragStressConfig = DEFAULT_DRAG_STRESS_CONFIG): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Import configuration from JSON
 */
export function importConfigFromJson(jsonString: string): DragStressConfig {
  const parsed = JSON.parse(jsonString);
  return validateDragStressConfig(parsed);
}
