/**
 * NP-050 – Telemetry Memory Leak Guard Configuration
 * 
 * Configuration schema and defaults for memory leak detection
 * in telemetry pipelines with thresholds and alert channels.
 * 
 * @since 2026-01-21
 * @author Sentinel-Analytics – Leak Guard
 */

import { z } from 'zod';

// === Configuration Schema ===

/**
 * Alert channel configuration for memory leak notifications.
 */
export const AlertChannelConfigSchema = z.object({
  /** Channel type (console, file, webhook, email) */
  type: z.enum(['console', 'file', 'webhook', 'email']),
  /** Channel identifier (filename, URL, email address) */
  target: z.string(),
  /** Alert severity levels to send */
  severity: z.enum(['low', 'medium', 'high', 'critical']).array(),
  /** Custom message template */
  template: z.string().optional(),
  /** Rate limiting (max alerts per hour) */
  rateLimit: z.number().min(1).default(10),
});

/**
 * Memory threshold configuration for leak detection.
 */
export const MemoryThresholdConfigSchema = z.object({
  /** Maximum heap size in MB */
  maxHeapSizeMB: z.number().min(10).default(100),
  /** Memory growth rate threshold (MB per minute) */
  growthRateMBPerMin: z.number().min(0.1).default(5.0),
  /** Sample window size for trend analysis (minutes) */
  sampleWindowMin: z.number().min(1).default(10),
  /** Minimum samples required for analysis */
  minSamples: z.number().min(3).default(5),
  /** Leak detection sensitivity (0.0-1.0) */
  sensitivity: z.number().min(0).max(1).default(0.7),
  /** Memory leak slope threshold (MB per minute) */
  leakSlopeThreshold: z.number().min(0.1).default(2.0),
});

/**
 * Sampling configuration for memory monitoring.
 */
export const SamplingConfigSchema = z.object({
  /** Sampling interval in milliseconds */
  intervalMs: z.number().min(100).default(5000),
  /** Maximum samples to keep in memory */
  maxSamples: z.number().min(10).default(100),
  /** Sample retention period (minutes) */
  retentionMin: z.number().min(1).default(60),
  /** Enable automatic cleanup of old samples */
  enableCleanup: z.boolean().default(true),
  /** Sampling strategy (fixed, adaptive, event-driven) */
  strategy: z.enum(['fixed', 'adaptive', 'event-driven']).default('fixed'),
});

/**
 * Complete memory leak guard configuration.
 */
export const MemoryLeakGuardConfigSchema = z.object({
  /** Guard instance identifier */
  instanceId: z.string(),
  /** Enable/disable the guard */
  enabled: z.boolean().default(true),
  /** Memory thresholds */
  thresholds: MemoryThresholdConfigSchema,
  /** Sampling configuration */
  sampling: SamplingConfigSchema,
  /** Alert channels */
  alertChannels: AlertChannelConfigSchema.array(),
  /** Persistence configuration */
  persistence: z.object({
    /** Enable persistence of memory samples */
    enabled: z.boolean().default(true),
    /** Storage key for samples */
    storageKey: z.string().default('telemetry_memory_samples'),
    /** Persistence interval (minutes) */
    intervalMin: z.number().min(1).default(5),
  }),
  /** Telemetry configuration */
  telemetry: z.object({
    /** Enable telemetry events */
    enabled: z.boolean().default(true),
    /** Event prefix */
    eventPrefix: z.string().default('telemetry_leak_guard'),
    /** Include detailed memory data in events */
    includeMemoryData: z.boolean().default(false),
  }),
  /** Performance impact settings */
  performance: z.object({
    /** Maximum CPU usage percentage (0-100) */
    maxCpuUsage: z.number().min(0).max(100).default(5),
    /** Maximum sampling time (milliseconds) */
    maxSampleTimeMs: z.number().min(1).default(10),
    /** Enable adaptive sampling based on load */
    enableAdaptiveSampling: z.boolean().default(true),
  }),
});

// === Type Exports ===

export type AlertChannelConfig = z.infer<typeof AlertChannelConfigSchema>;
export type MemoryThresholdConfig = z.infer<typeof MemoryThresholdConfigSchema>;
export type SamplingConfig = z.infer<typeof SamplingConfigSchema>;
export type MemoryLeakGuardConfig = z.infer<typeof MemoryLeakGuardConfigSchema>;

// === Default Configuration ===

/**
 * Default alert channels for memory leak detection.
 */
export const DEFAULT_ALERT_CHANNELS: AlertChannelConfig[] = [
  {
    type: 'console',
    target: 'stdout',
    severity: ['medium', 'high', 'critical'],
    rateLimit: 10,
  },
  {
    type: 'file',
    target: 'test-results/telemetry-memory-leaks.log',
    severity: ['high', 'critical'],
    rateLimit: 5,
    template: '[{timestamp}] MEMORY LEAK DETECTED: {severity} - {message}',
  },
];

/**
 * Default memory thresholds for leak detection.
 */
export const DEFAULT_MEMORY_THRESHOLDS: MemoryThresholdConfig = {
  maxHeapSizeMB: 100,
  growthRateMBPerMin: 5.0,
  sampleWindowMin: 10,
  minSamples: 5,
  sensitivity: 0.7,
  leakSlopeThreshold: 2.0,
};

/**
 * Default sampling configuration.
 */
export const DEFAULT_SAMPLING_CONFIG: SamplingConfig = {
  intervalMs: 5000,
  maxSamples: 100,
  retentionMin: 60,
  enableCleanup: true,
  strategy: 'adaptive',
};

/**
 * Default memory leak guard configuration.
 */
export const DEFAULT_MEMORY_LEAK_GUARD_CONFIG: MemoryLeakGuardConfig = {
  instanceId: 'telemetry-leak-guard-default',
  enabled: true,
  thresholds: DEFAULT_MEMORY_THRESHOLDS,
  sampling: DEFAULT_SAMPLING_CONFIG,
  alertChannels: DEFAULT_ALERT_CHANNELS,
  persistence: {
    enabled: true,
    storageKey: 'telemetry_memory_samples',
    intervalMin: 5,
  },
  telemetry: {
    enabled: true,
    eventPrefix: 'telemetry_leak_guard',
    includeMemoryData: false,
  },
  performance: {
    maxCpuUsage: 5,
    maxSampleTimeMs: 10,
    enableAdaptiveSampling: true,
  },
};

// === Configuration Utilities ===

/**
 * Validates a memory leak guard configuration.
 */
export function validateMemoryLeakGuardConfig(config: unknown): MemoryLeakGuardConfig {
  return MemoryLeakGuardConfigSchema.parse(config);
}

/**
 * Creates a memory leak guard configuration with overrides.
 */
export function createMemoryLeakGuardConfig(overrides: Partial<MemoryLeakGuardConfig> = {}): MemoryLeakGuardConfig {
  return {
    ...DEFAULT_MEMORY_LEAK_GUARD_CONFIG,
    ...overrides,
    // Merge nested objects properly
    thresholds: {
      ...DEFAULT_MEMORY_THRESHOLDS,
      ...(overrides.thresholds || {}),
    },
    sampling: {
      ...DEFAULT_SAMPLING_CONFIG,
      ...(overrides.sampling || {}),
    },
    persistence: {
      ...DEFAULT_MEMORY_LEAK_GUARD_CONFIG.persistence,
      ...(overrides.persistence || {}),
    },
    telemetry: {
      ...DEFAULT_MEMORY_LEAK_GUARD_CONFIG.telemetry,
      ...(overrides.telemetry || {}),
    },
    performance: {
      ...DEFAULT_MEMORY_LEAK_GUARD_CONFIG.performance,
      ...(overrides.performance || {}),
    },
  };
}

/**
 * Creates environment-specific configurations.
 */
export function createEnvironmentSpecificConfig(env: 'development' | 'staging' | 'production'): MemoryLeakGuardConfig {
  const baseConfig = createMemoryLeakGuardConfig();
  
  switch (env) {
    case 'development':
      return createMemoryLeakGuardConfig({
        instanceId: `telemetry-leak-guard-${env}`,
        thresholds: {
          ...baseConfig.thresholds,
          maxHeapSizeMB: 200, // More lenient in development
          growthRateMBPerMin: 10.0,
        },
        sampling: {
          ...baseConfig.sampling,
          intervalMs: 2000, // More frequent sampling
        },
        alertChannels: [
          ...baseConfig.alertChannels,
          {
            type: 'console',
            target: 'stdout',
            severity: ['low', 'medium', 'high', 'critical'],
            rateLimit: 20,
          },
        ],
      });
      
    case 'staging':
      return createMemoryLeakGuardConfig({
        instanceId: `telemetry-leak-guard-${env}`,
        thresholds: {
          ...baseConfig.thresholds,
          maxHeapSizeMB: 150,
          growthRateMBPerMin: 7.5,
        },
        alertChannels: [
          ...baseConfig.alertChannels,
          {
            type: 'webhook',
            target: 'https://staging-webhook.example.com/alerts',
            severity: ['high', 'critical'],
            rateLimit: 3,
          },
        ],
      });
      
    case 'production':
      return createMemoryLeakGuardConfig({
        instanceId: `telemetry-leak-guard-${env}`,
        thresholds: {
          ...baseConfig.thresholds,
          maxHeapSizeMB: 100, // Stricter in production
          growthRateMBPerMin: 3.0,
          sensitivity: 0.8,
        },
        sampling: {
          ...baseConfig.sampling,
          intervalMs: 10000, // Less frequent in production
          maxSamples: 200,
        },
        alertChannels: [
          {
            type: 'webhook',
            target: 'https://alerts.example.com/telemetry',
            severity: ['critical'],
            rateLimit: 1,
          },
          {
            type: 'email',
            target: 'alerts@example.com',
            severity: ['critical'],
            rateLimit: 1,
          },
        ],
      });
      
    default:
      return baseConfig;
  }
}

/**
 * Merges multiple configurations with precedence.
 */
export function mergeMemoryLeakGuardConfigs(...configs: Partial<MemoryLeakGuardConfig>[]): MemoryLeakGuardConfig {
  return configs.reduce((merged, config) => createMemoryLeakGuardConfig({ ...merged, ...config }), DEFAULT_MEMORY_LEAK_GUARD_CONFIG);
}

// === Configuration Validation ===

/**
 * Checks if a configuration is valid for the current environment.
 */
export function validateConfigForEnvironment(config: MemoryLeakGuardConfig, env: string): boolean {
  // Basic validation
  if (!config.enabled) return true;
  
  // Check thresholds are reasonable
  if (config.thresholds.maxHeapSizeMB < 10 || config.thresholds.maxHeapSizeMB > 1000) {
    return false;
  }
  
  // Check sampling interval is reasonable
  if (config.sampling.intervalMs < 100 || config.sampling.intervalMs > 60000) {
    return false;
  }
  
  // Check alert channels have targets
  if (config.alertChannels.some(channel => !channel.target)) {
    return false;
  }
  
  return true;
}

/**
 * Gets configuration validation errors.
 */
export function getConfigValidationErrors(config: unknown): string[] {
  try {
    validateMemoryLeakGuardConfig(config);
    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    }
    return ['Unknown validation error'];
  }
}
