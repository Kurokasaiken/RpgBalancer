/**
 * PersistenceService Chaos Monkey Configuration
 * 
 * Configuration for fault injection testing of PersistenceService
 * with various chaos scenarios and KPI tracking.
 */

import { z } from 'zod';

/**
 * Fault injection types
 */
export const FaultTypeSchema = z.enum([
  'latency',      // Add artificial delay
  'failure',      // Simulate failure
  'corruption',   // Corrupt data
  'timeout',      // Simulate timeout
  'partial',      // Partial success/failure
  'intermittent', // Intermittent issues
  'cascade',      // Cascading failures
  'exhaustion',   // Resource exhaustion
]);

export type FaultType = z.infer<typeof FaultTypeSchema>;

/**
 * Fault severity levels
 */
export const FaultSeveritySchema = z.enum([
  'low',      // Minor issues
  'medium',   // Moderate issues
  'high',     // Severe issues
  'critical', // Critical failures
]);

export type FaultSeverity = z.infer<typeof FaultSeveritySchema>;

/**
 * Fault injection configuration
 */
export interface FaultInjection {
  /** Type of fault to inject */
  type: FaultType;
  /** Severity level of the fault */
  severity: FaultSeverity;
  /** Probability of fault occurring (0-1) */
  probability: number;
  /** Duration of fault in milliseconds */
  duration: number;
  /** Target operations (save, load, clear, etc.) */
  targetOperations: string[];
  /** Additional fault-specific parameters */
  parameters: Record<string, unknown>;
  /** Enable/disable this fault */
  enabled: boolean;
}

/**
 * Latency fault parameters
 */
export interface LatencyParameters {
  /** Minimum delay in milliseconds */
  minDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Delay distribution type */
  distribution: 'fixed' | 'uniform' | 'exponential' | 'normal';
  /** Jitter factor for delay variation */
  jitter: number;
}

/**
 * Failure fault parameters
 */
export interface FailureParameters {
  /** Error type to throw */
  errorType: 'timeout' | 'network' | 'storage' | 'quota' | 'permission' | 'unknown';
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Whether to retry automatically */
  autoRetry: boolean;
  /** Number of retry attempts */
  retryAttempts: number;
}

/**
 * Corruption fault parameters
 */
export interface CorruptionParameters {
  /** Type of corruption */
  corruptionType: 'truncate' | 'modify' | 'nullify' | 'duplicate' | 'scramble';
  /** Corruption percentage (0-1) */
  corruptionPercentage: number;
  /** Target data keys to corrupt */
  targetKeys?: string[];
  /** Preserve data structure */
  preserveStructure: boolean;
}

/**
 * Timeout fault parameters
 */
export interface TimeoutParameters {
  /** Timeout duration in milliseconds */
  timeout: number;
  /** Whether to simulate partial timeout */
  partialTimeout: boolean;
  /** Timeout behavior */
  timeoutBehavior: 'reject' | 'timeout' | 'hang';
}

/**
 * Partial fault parameters
 */
export interface PartialParameters {
  /** Success rate (0-1) */
  successRate: number;
  /** Partial data return */
  returnPartial: boolean;
  /** Missing data percentage */
  missingPercentage: number;
}

/**
 * Intermittent fault parameters
 */
export interface IntermittentParameters {
  /** Pattern of intermittent failures */
  pattern: 'random' | 'periodic' | 'burst' | 'decay';
  /** Burst size for burst pattern */
  burstSize: number;
  /** Period duration for periodic pattern */
  periodDuration: number;
  /** Active periods for periodic pattern */
  activePeriods: number;
}

/**
 * Cascade fault parameters
 */
export interface CascadeParameters {
  /** Cascade trigger conditions */
  triggerConditions: string[];
  /** Cascade delay in milliseconds */
  cascadeDelay: number;
  /** Cascade propagation factor */
  propagationFactor: number;
  /** Maximum cascade depth */
  maxCascadeDepth: number;
}

/**
 * Exhaustion fault parameters
 */
export interface ExhaustionParameters {
  /** Resource type to exhaust */
  resourceType: 'memory' | 'storage' | 'quota' | 'connections';
  /** Exhaustion rate */
  exhaustionRate: number;
  /** Recovery time in milliseconds */
  recoveryTime: number;
  /** Partial exhaustion threshold */
  partialThreshold: number;
}

/**
 * Chaos scenario configuration
 */
export interface ChaosScenario {
  /** Unique scenario identifier */
  id: string;
  /** Scenario name */
  name: string;
  /** Scenario description */
  description: string;
  /** List of fault injections */
  faults: FaultInjection[];
  /** Scenario duration in milliseconds */
  duration: number;
  /** Warmup period before chaos starts */
  warmupPeriod: number;
  /** Cooldown period after chaos ends */
  cooldownPeriod: number;
  /** Target namespace for testing */
  namespace: string;
  /** Enable/disable scenario */
  enabled: boolean;
}

/**
 * KPI metrics configuration
 */
export interface ChaosKPIConfig {
  /** Track operation latency */
  trackLatency: boolean;
  /** Track success/failure rates */
  trackSuccessRate: boolean;
  /** Track error types and frequencies */
  trackErrors: boolean;
  /** Track resource usage */
  trackResourceUsage: boolean;
  /** Track data integrity */
  trackDataIntegrity: boolean;
  /** Track recovery time */
  trackRecoveryTime: boolean;
  /** Track cascade effects */
  trackCascadeEffects: boolean;
  /** Sampling rate for metrics collection */
  samplingRate: number;
  /** Metrics aggregation window */
  aggregationWindow: number;
}

/**
 * Chaos harness configuration
 */
export interface ChaosHarnessConfig {
  /** Chaos scenarios */
  scenarios: ChaosScenario[];
  /** KPI tracking configuration */
  kpiConfig: ChaosKPIConfig;
  /** Global settings */
  settings: {
    /** Enable chaos mode */
    enabled: boolean;
    /** Default namespace for testing */
    defaultNamespace: string;
    /** Maximum concurrent scenarios */
    maxConcurrentScenarios: number;
    /** Global timeout for operations */
    globalTimeout: number;
    /** Enable dry run mode */
    dryRun: boolean;
    /** Enable verbose logging */
    verbose: boolean;
    /** Enable metrics export */
    enableMetricsExport: boolean;
  };
}

/**
 * Chaos operation result
 */
export interface ChaosOperationResult {
  /** Operation type */
  operation: string;
  /** Success status */
  success: boolean;
  /** Operation duration */
  duration: number;
  /** Error information */
  error?: {
    type: string;
    message: string;
    code?: string;
    stack?: string;
  };
  /** Faults injected during operation */
  injectedFaults: FaultType[];
  /** Data integrity check result */
  dataIntegrity?: {
    passed: boolean;
    issues: string[];
  };
  /** Resource usage during operation */
  resourceUsage?: {
    memory: number;
    storage: number;
    connections: number;
  };
  /** Timestamp */
  timestamp: number;
}

/**
 * Chaos scenario result
 */
export interface ChaosScenarioResult {
  /** Scenario ID */
  scenarioId: string;
  /** Scenario name */
  scenarioName: string;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Total duration */
  duration: number;
  /** Operation results */
  operations: ChaosOperationResult[];
  /** Summary statistics */
  summary: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageLatency: number;
    maxLatency: number;
    minLatency: number;
    errorRate: number;
    dataIntegrityIssues: number;
    resourceExhaustionEvents: number;
    cascadeEvents: number;
  };
  /** Fault injection summary */
  faultSummary: {
    totalFaultsInjected: number;
    faultsByType: Record<FaultType, number>;
    faultsBySeverity: Record<FaultSeverity, number>;
  };
  /** KPI metrics */
  kpiMetrics: Record<string, number>;
}

/**
 * Zod schemas for validation
 */
export const FaultInjectionSchema = z.object({
  type: FaultTypeSchema,
  severity: FaultSeveritySchema,
  probability: z.number().min(0).max(1),
  duration: z.number().min(0),
  targetOperations: z.array(z.string()),
  parameters: z.record(z.unknown()),
  enabled: z.boolean(),
});

export const ChaosScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  faults: z.array(FaultInjectionSchema),
  duration: z.number().min(0),
  warmupPeriod: z.number().min(0),
  cooldownPeriod: z.number().min(0),
  namespace: z.string(),
  enabled: z.boolean(),
});

export const ChaosHarnessConfigSchema = z.object({
  scenarios: z.array(ChaosScenarioSchema),
  kpiConfig: z.object({
    trackLatency: z.boolean(),
    trackSuccessRate: z.boolean(),
    trackErrors: z.boolean(),
    trackResourceUsage: z.boolean(),
    trackDataIntegrity: z.boolean(),
    trackRecoveryTime: z.boolean(),
    trackCascadeEffects: z.boolean(),
    samplingRate: z.number().min(0).max(1),
    aggregationWindow: z.number().min(0),
  }),
  settings: z.object({
    enabled: z.boolean(),
    defaultNamespace: z.string(),
    maxConcurrentScenarios: z.number().min(1),
    globalTimeout: z.number().min(0),
    dryRun: z.boolean(),
    verbose: z.boolean(),
    enableMetricsExport: z.boolean(),
  }),
});

/**
 * Default configuration
 */
export const DEFAULT_CHAOS_HARNESS_CONFIG: ChaosHarnessConfig = {
  scenarios: [
    {
      id: 'basic-latency',
      name: 'Basic Latency Injection',
      description: 'Injects moderate latency into all operations',
      faults: [
        {
          type: 'latency',
          severity: 'medium',
          probability: 0.3,
          duration: 5000,
          targetOperations: ['save', 'load'],
          parameters: {
            minDelay: 100,
            maxDelay: 500,
            distribution: 'uniform',
            jitter: 0.2,
          },
          enabled: true,
        },
      ],
      duration: 10000,
      warmupPeriod: 1000,
      cooldownPeriod: 2000,
      namespace: 'chaos-test-basic',
      enabled: true,
    },
    {
      id: 'failure-injection',
      name: 'Failure Injection',
      description: 'Injects random failures into save operations',
      faults: [
        {
          type: 'failure',
          severity: 'high',
          probability: 0.2,
          duration: 8000,
          targetOperations: ['save'],
          parameters: {
            errorType: 'network',
            message: 'Simulated network failure',
            code: 'NETWORK_ERROR',
            autoRetry: false,
            retryAttempts: 0,
          },
          enabled: true,
        },
      ],
      duration: 12000,
      warmupPeriod: 1000,
      cooldownPeriod: 3000,
      namespace: 'chaos-test-failure',
      enabled: true,
    },
    {
      id: 'data-corruption',
      name: 'Data Corruption',
      description: 'Corrupts data during load operations',
      faults: [
        {
          type: 'corruption',
          severity: 'critical',
          probability: 0.1,
          duration: 6000,
          targetOperations: ['load'],
          parameters: {
            corruptionType: 'modify',
            corruptionPercentage: 0.3,
            preserveStructure: true,
          },
          enabled: true,
        },
      ],
      duration: 8000,
      warmupPeriod: 1000,
      cooldownPeriod: 2000,
      namespace: 'chaos-test-corruption',
      enabled: false, // Disabled by default due to critical severity
    },
    {
      id: 'timeout-stress',
      name: 'Timeout Stress',
      description: 'Injects timeouts into all operations',
      faults: [
        {
          type: 'timeout',
          severity: 'high',
          probability: 0.25,
          duration: 7000,
          targetOperations: ['save', 'load', 'clear'],
          parameters: {
            timeout: 1000,
            partialTimeout: false,
            timeoutBehavior: 'timeout',
          },
          enabled: true,
        },
      ],
      duration: 10000,
      warmupPeriod: 1000,
      cooldownPeriod: 3000,
      namespace: 'chaos-test-timeout',
      enabled: true,
    },
    {
      id: 'intermittent-issues',
      name: 'Intermittent Issues',
      description: 'Simulates intermittent connectivity issues',
      faults: [
        {
          type: 'intermittent',
          severity: 'medium',
          probability: 0.4,
          duration: 15000,
          targetOperations: ['save', 'load'],
          parameters: {
            pattern: 'burst',
            burstSize: 3,
            periodDuration: 2000,
            activePeriods: 2,
          },
          enabled: true,
        },
      ],
      duration: 20000,
      warmupPeriod: 2000,
      cooldownPeriod: 5000,
      namespace: 'chaos-test-intermittent',
      enabled: true,
    },
  ],
  kpiConfig: {
    trackLatency: true,
    trackSuccessRate: true,
    trackErrors: true,
    trackResourceUsage: true,
    trackDataIntegrity: true,
    trackRecoveryTime: true,
    trackCascadeEffects: true,
    samplingRate: 1.0,
    aggregationWindow: 1000,
  },
  settings: {
    enabled: true,
    defaultNamespace: 'chaos-test',
    maxConcurrentScenarios: 3,
    globalTimeout: 30000,
    dryRun: false,
    verbose: true,
    enableMetricsExport: true,
  },
};

/**
 * Preset configurations
 */
export const CHAOS_HARNESS_PRESETS = {
  /** Light testing for CI/CD pipelines */
  light: {
    ...DEFAULT_CHAOS_HARNESS_CONFIG,
    scenarios: [
      {
        ...DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[0],
        faults: [
          {
            ...DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[0].faults[0],
            probability: 0.1,
            duration: 2000,
            parameters: {
              minDelay: 50,
              maxDelay: 200,
              distribution: 'fixed',
              jitter: 0.1,
            },
          },
        ],
        duration: 5000,
      },
    ],
    settings: {
      ...DEFAULT_CHAOS_HARNESS_CONFIG.settings,
      verbose: false,
    },
  },
  
  /** Medium testing for staging environments */
  medium: {
    ...DEFAULT_CHAOS_HARNESS_CONFIG,
    scenarios: DEFAULT_CHAOS_HARNESS_CONFIG.scenarios.slice(0, 3),
  },
  
  /** Heavy testing for chaos engineering */
  heavy: {
    ...DEFAULT_CHAOS_HARNESS_CONFIG,
    scenarios: DEFAULT_CHAOS_HARNESS_CONFIG.scenarios,
    settings: {
      ...DEFAULT_CHAOS_HARNESS_CONFIG.settings,
      maxConcurrentScenarios: 5,
    },
  },
  
  /** Performance testing focus */
  performance: {
    ...DEFAULT_CHAOS_HARNESS_CONFIG,
    scenarios: [
      DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[0], // latency
      DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[3], // timeout
    ],
    kpiConfig: {
      ...DEFAULT_CHAOS_HARNESS_CONFIG.kpiConfig,
      trackLatency: true,
      trackResourceUsage: true,
      trackRecoveryTime: true,
      trackErrors: false,
      trackDataIntegrity: false,
      trackCascadeEffects: false,
    },
  },
  
  /** Reliability testing focus */
  reliability: {
    ...DEFAULT_CHAOS_HARNESS_CONFIG,
    scenarios: [
      DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[1], // failure
      DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[2], // corruption
      DEFAULT_CHAOS_HARNESS_CONFIG.scenarios[4], // intermittent
    ],
    kpiConfig: {
      ...DEFAULT_CHAOS_HARNESS_CONFIG.kpiConfig,
      trackSuccessRate: true,
      trackErrors: true,
      trackDataIntegrity: true,
      trackRecoveryTime: true,
      trackCascadeEffects: true,
    },
  },
} as const;

/**
 * Chaos harness preset type
 */
export type ChaosHarnessPreset = keyof typeof CHAOS_HARNESS_PRESETS;

/**
 * Export configuration
 */
export interface ChaosExportConfig {
  /** Include raw operation results */
  includeRawResults: boolean;
  /** Include summary statistics */
  includeSummary: boolean;
  /** Include KPI metrics */
  includeKPI: boolean;
  /** Include fault injection details */
  includeFaults: boolean;
  /** Export format */
  format: 'json' | 'csv' | 'markdown';
  /** Time range filter */
  timeRange?: {
    start: Date;
    end: Date;
  };
  /** Scenario filter */
  scenarios?: string[];
  /** Operation type filter */
  operations?: string[];
}
