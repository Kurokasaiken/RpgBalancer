/**
 * ActivitySlot Persistence Chaos Runner
 * 
 * Config-first chaos testing runner for ActivitySlot persistence resilience.
 * Simulates crash scenarios, quota exceeded, and duplicate hydration.
 * 
 * @since NP-156 – Idle Village ActivitySlot Persistence Chaos Tests
 */

import { z } from 'zod';

/**
 * Chaos event types
 */
export type ChaosEventType = 
  | 'crash_mid_save'
  | 'crash_mid_load'
  | 'quota_exceeded'
  | 'duplicate_hydration'
  | 'corrupted_data'
  | 'network_timeout'
  | 'concurrent_writes';

/**
 * Chaos event configuration
 */
export interface ChaosEvent {
  /** Event identifier */
  id: string;
  /** Event type */
  type: ChaosEventType;
  /** Event description */
  description: string;
  /** Probability of occurrence (0-1) */
  probability: number;
  /** Timing of injection */
  timing: 'before_save' | 'during_save' | 'after_save' | 'before_load' | 'during_load' | 'after_load';
  /** Expected recovery behavior */
  expectedRecovery: {
    shouldRecover: boolean;
    maxRecoveryTimeMs: number;
    dataIntegrityPreserved: boolean;
  };
  /** Mitigation strategies */
  mitigations: string[];
}

/**
 * Chaos test scenario
 */
export interface ChaosScenario {
  /** Scenario identifier */
  id: string;
  /** Scenario name */
  name: string;
  /** Scenario description */
  description: string;
  /** Events in this scenario */
  events: ChaosEvent[];
  /** Initial state */
  initialState: Record<string, unknown>;
  /** Expected final state */
  expectedFinalState: Record<string, unknown>;
  /** Timeout for scenario */
  timeoutMs: number;
}

/**
 * Chaos runner configuration
 */
export interface ChaosRunnerConfig {
  /** Test scenarios */
  scenarios: ChaosScenario[];
  /** Runner settings */
  runner: {
    maxRetries: number;
    retryDelayMs: number;
    enableTelemetry: boolean;
    verboseLogging: boolean;
  };
  /** Recovery KPIs */
  kpis: {
    maxRecoveryTimeMs: number;
    minDataIntegrityPercent: number;
    maxFailureRate: number;
  };
  /** Export settings */
  export: {
    formats: ('json' | 'markdown')[];
    outputDir: string;
    includeStackTraces: boolean;
  };
}

/**
 * Chaos test result
 */
export interface ChaosTestResult {
  scenarioId: string;
  success: boolean;
  duration: number;
  eventsTriggered: number;
  eventsRecovered: number;
  dataIntegrityScore: number;
  errors: Array<{
    event: string;
    error: string;
    stackTrace?: string;
  }>;
  recoveryMetrics: {
    averageRecoveryTimeMs: number;
    maxRecoveryTimeMs: number;
    failedRecoveries: number;
  };
  mitigationsSuggested: string[];
}

/**
 * Chaos run result
 */
export interface ChaosRunResult {
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  totalEvents: number;
  recoveredEvents: number;
  averageDataIntegrity: number;
  kpisMet: boolean;
  results: ChaosTestResult[];
  timestamp: string;
  suggestions: string[];
}

/**
 * Zod schemas
 */
export const ChaosEventSchema = z.object({
  id: z.string(),
  type: z.enum(['crash_mid_save', 'crash_mid_load', 'quota_exceeded', 'duplicate_hydration', 'corrupted_data', 'network_timeout', 'concurrent_writes']),
  description: z.string(),
  probability: z.number().min(0).max(1),
  timing: z.enum(['before_save', 'during_save', 'after_save', 'before_load', 'during_load', 'after_load']),
  expectedRecovery: z.object({
    shouldRecover: z.boolean(),
    maxRecoveryTimeMs: z.number().min(0),
    dataIntegrityPreserved: z.boolean(),
  }),
  mitigations: z.array(z.string()),
});

export const ChaosScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  events: z.array(ChaosEventSchema),
  initialState: z.record(z.unknown()),
  expectedFinalState: z.record(z.unknown()),
  timeoutMs: z.number().min(1000).max(60000),
});

export const ChaosRunnerConfigSchema = z.object({
  scenarios: z.array(ChaosScenarioSchema).min(1),
  runner: z.object({
    maxRetries: z.number().min(0).max(10).default(3),
    retryDelayMs: z.number().min(0).max(5000).default(1000),
    enableTelemetry: z.boolean().default(true),
    verboseLogging: z.boolean().default(false),
  }),
  kpis: z.object({
    maxRecoveryTimeMs: z.number().min(100).default(5000),
    minDataIntegrityPercent: z.number().min(0).max(100).default(95),
    maxFailureRate: z.number().min(0).max(1).default(0.05),
  }),
  export: z.object({
    formats: z.array(z.enum(['json', 'markdown'])).default(['json', 'markdown']),
    outputDir: z.string().default('test-results/activityslot-chaos'),
    includeStackTraces: z.boolean().default(true),
  }),
});

/**
 * Default chaos events
 */
export const DEFAULT_CHAOS_EVENTS: ChaosEvent[] = [
  {
    id: 'crash-mid-save',
    type: 'crash_mid_save',
    description: 'Application crashes during ActivitySlot save operation',
    probability: 0.1,
    timing: 'during_save',
    expectedRecovery: {
      shouldRecover: true,
      maxRecoveryTimeMs: 3000,
      dataIntegrityPreserved: true,
    },
    mitigations: [
      'Implement atomic write operations',
      'Use write-ahead logging',
      'Add save operation checkpoints',
    ],
  },
  {
    id: 'crash-mid-load',
    type: 'crash_mid_load',
    description: 'Application crashes during ActivitySlot load operation',
    probability: 0.05,
    timing: 'during_load',
    expectedRecovery: {
      shouldRecover: true,
      maxRecoveryTimeMs: 2000,
      dataIntegrityPreserved: true,
    },
    mitigations: [
      'Implement graceful load failure handling',
      'Use default fallback state',
      'Add load operation timeout',
    ],
  },
  {
    id: 'quota-exceeded',
    type: 'quota_exceeded',
    description: 'Storage quota exceeded during save',
    probability: 0.15,
    timing: 'during_save',
    expectedRecovery: {
      shouldRecover: true,
      maxRecoveryTimeMs: 1000,
      dataIntegrityPreserved: false,
    },
    mitigations: [
      'Implement quota monitoring',
      'Add data compression',
      'Implement cleanup of old data',
      'Show user warning before quota limit',
    ],
  },
  {
    id: 'duplicate-hydration',
    type: 'duplicate_hydration',
    description: 'Multiple tabs attempt to hydrate ActivitySlot store simultaneously',
    probability: 0.2,
    timing: 'during_load',
    expectedRecovery: {
      shouldRecover: true,
      maxRecoveryTimeMs: 500,
      dataIntegrityPreserved: true,
    },
    mitigations: [
      'Implement tab synchronization',
      'Use BroadcastChannel API',
      'Add hydration lock mechanism',
      'Detect and merge concurrent changes',
    ],
  },
  {
    id: 'corrupted-data',
    type: 'corrupted_data',
    description: 'Stored ActivitySlot data is corrupted or invalid',
    probability: 0.05,
    timing: 'during_load',
    expectedRecovery: {
      shouldRecover: true,
      maxRecoveryTimeMs: 1000,
      dataIntegrityPreserved: false,
    },
    mitigations: [
      'Implement data validation on load',
      'Use schema versioning',
      'Add data migration logic',
      'Keep backup of last known good state',
    ],
  },
  {
    id: 'network-timeout',
    type: 'network_timeout',
    description: 'Network timeout during async persistence operation',
    probability: 0.1,
    timing: 'during_save',
    expectedRecovery: {
      shouldRecover: true,
      maxRecoveryTimeMs: 5000,
      dataIntegrityPreserved: true,
    },
    mitigations: [
      'Implement retry logic with exponential backoff',
      'Add operation timeout',
      'Queue failed operations for retry',
      'Show user feedback for pending operations',
    ],
  },
  {
    id: 'concurrent-writes',
    type: 'concurrent_writes',
    description: 'Multiple concurrent write operations to same ActivitySlot',
    probability: 0.15,
    timing: 'during_save',
    expectedRecovery: {
      shouldRecover: true,
      maxRecoveryTimeMs: 2000,
      dataIntegrityPreserved: true,
    },
    mitigations: [
      'Implement write operation queue',
      'Use optimistic locking',
      'Add conflict resolution strategy',
      'Debounce rapid save operations',
    ],
  },
];

/**
 * Default chaos scenarios
 */
export const DEFAULT_CHAOS_SCENARIOS: ChaosScenario[] = [
  {
    id: 'crash-recovery',
    name: 'Crash Recovery',
    description: 'Test recovery from mid-operation crashes',
    events: [
      DEFAULT_CHAOS_EVENTS[0], // crash-mid-save
      DEFAULT_CHAOS_EVENTS[1], // crash-mid-load
    ],
    initialState: {
      activitySlots: [
        { id: 'slot-1', activityId: 'mining', residentId: 'resident-1' },
        { id: 'slot-2', activityId: 'farming', residentId: 'resident-2' },
      ],
    },
    expectedFinalState: {
      activitySlots: [
        { id: 'slot-1', activityId: 'mining', residentId: 'resident-1' },
        { id: 'slot-2', activityId: 'farming', residentId: 'resident-2' },
      ],
    },
    timeoutMs: 10000,
  },
  {
    id: 'quota-handling',
    name: 'Quota Exceeded Handling',
    description: 'Test behavior when storage quota is exceeded',
    events: [DEFAULT_CHAOS_EVENTS[2]], // quota-exceeded
    initialState: {
      activitySlots: Array.from({ length: 100 }).map((_, i) => ({
        id: `slot-${i}`,
        activityId: `activity-${i}`,
        residentId: `resident-${i}`,
      })),
    },
    expectedFinalState: {
      activitySlots: [], // Should gracefully degrade
    },
    timeoutMs: 5000,
  },
  {
    id: 'multi-tab-sync',
    name: 'Multi-Tab Synchronization',
    description: 'Test duplicate hydration from multiple tabs',
    events: [DEFAULT_CHAOS_EVENTS[3]], // duplicate-hydration
    initialState: {
      activitySlots: [
        { id: 'slot-1', activityId: 'mining', residentId: 'resident-1' },
      ],
    },
    expectedFinalState: {
      activitySlots: [
        { id: 'slot-1', activityId: 'mining', residentId: 'resident-1' },
      ],
    },
    timeoutMs: 3000,
  },
  {
    id: 'data-corruption',
    name: 'Data Corruption Recovery',
    description: 'Test recovery from corrupted stored data',
    events: [DEFAULT_CHAOS_EVENTS[4]], // corrupted-data
    initialState: {
      activitySlots: 'CORRUPTED_DATA',
    },
    expectedFinalState: {
      activitySlots: [], // Should fallback to empty state
    },
    timeoutMs: 3000,
  },
  {
    id: 'concurrent-operations',
    name: 'Concurrent Operations',
    description: 'Test handling of concurrent write operations',
    events: [
      DEFAULT_CHAOS_EVENTS[5], // network-timeout
      DEFAULT_CHAOS_EVENTS[6], // concurrent-writes
    ],
    initialState: {
      activitySlots: [
        { id: 'slot-1', activityId: 'mining', residentId: 'resident-1' },
      ],
    },
    expectedFinalState: {
      activitySlots: [
        { id: 'slot-1', activityId: 'mining', residentId: 'resident-1' },
      ],
    },
    timeoutMs: 8000,
  },
];

/**
 * Default chaos runner configuration
 */
export const DEFAULT_CHAOS_RUNNER_CONFIG: ChaosRunnerConfig = {
  scenarios: DEFAULT_CHAOS_SCENARIOS,
  runner: {
    maxRetries: 3,
    retryDelayMs: 1000,
    enableTelemetry: true,
    verboseLogging: false,
  },
  kpis: {
    maxRecoveryTimeMs: 5000,
    minDataIntegrityPercent: 95,
    maxFailureRate: 0.05,
  },
  export: {
    formats: ['json', 'markdown'],
    outputDir: 'test-results/activityslot-chaos',
    includeStackTraces: true,
  },
};

/**
 * Validate chaos runner configuration
 */
export function validateChaosRunnerConfig(config: unknown): ChaosRunnerConfig {
  const result = ChaosRunnerConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid chaos runner configuration: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Create safe chaos runner configuration
 */
export function createSafeChaosRunnerConfig(
  config: Partial<ChaosRunnerConfig> = {}
): ChaosRunnerConfig {
  return validateChaosRunnerConfig({
    ...DEFAULT_CHAOS_RUNNER_CONFIG,
    ...config,
  });
}

/**
 * Calculate data integrity score
 */
export function calculateDataIntegrity(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>
): number {
  const expectedKeys = Object.keys(expected);
  if (expectedKeys.length === 0) return 100;

  let matchingKeys = 0;
  for (const key of expectedKeys) {
    if (JSON.stringify(expected[key]) === JSON.stringify(actual[key])) {
      matchingKeys++;
    }
  }

  return (matchingKeys / expectedKeys.length) * 100;
}

/**
 * Generate chaos run summary
 */
export function generateChaosRunSummary(result: ChaosRunResult): string {
  const lines: string[] = [
    '='.repeat(80),
    'ActivitySlot Persistence Chaos Test - Run Summary',
    '='.repeat(80),
    '',
    `Timestamp: ${result.timestamp}`,
    `Total Scenarios: ${result.totalScenarios}`,
    `Passed: ${result.passedScenarios}`,
    `Failed: ${result.failedScenarios}`,
    `Success Rate: ${((result.passedScenarios / result.totalScenarios) * 100).toFixed(1)}%`,
    '',
    `Total Events: ${result.totalEvents}`,
    `Recovered Events: ${result.recoveredEvents}`,
    `Recovery Rate: ${((result.recoveredEvents / result.totalEvents) * 100).toFixed(1)}%`,
    `Average Data Integrity: ${result.averageDataIntegrity.toFixed(1)}%`,
    `KPIs Met: ${result.kpisMet ? '✓' : '✗'}`,
    '',
    'Scenario Results:',
    '-'.repeat(80),
  ];

  for (const scenarioResult of result.results) {
    lines.push(
      `  ${scenarioResult.success ? '✓' : '✗'} ${scenarioResult.scenarioId}`,
      `    Duration: ${scenarioResult.duration}ms`,
      `    Events: ${scenarioResult.eventsTriggered} triggered, ${scenarioResult.eventsRecovered} recovered`,
      `    Data Integrity: ${scenarioResult.dataIntegrityScore.toFixed(1)}%`,
      `    Avg Recovery Time: ${scenarioResult.recoveryMetrics.averageRecoveryTimeMs.toFixed(0)}ms`,
      `    Max Recovery Time: ${scenarioResult.recoveryMetrics.maxRecoveryTimeMs.toFixed(0)}ms`,
      `    Failed Recoveries: ${scenarioResult.recoveryMetrics.failedRecoveries}`
    );

    if (scenarioResult.errors.length > 0) {
      lines.push('    Errors:');
      scenarioResult.errors.forEach(error => {
        lines.push(`      - ${error.event}: ${error.error}`);
      });
    }

    if (scenarioResult.mitigationsSuggested.length > 0) {
      lines.push('    Suggested Mitigations:');
      scenarioResult.mitigationsSuggested.forEach(mitigation => {
        lines.push(`      - ${mitigation}`);
      });
    }

    lines.push('');
  }

  if (result.suggestions.length > 0) {
    lines.push('Overall Suggestions:',  '-'.repeat(80));
    result.suggestions.forEach(suggestion => {
      lines.push(`  - ${suggestion}`);
    });
    lines.push('');
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Export chaos run result to JSON
 */
export function exportToJSON(result: ChaosRunResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Export chaos run result to Markdown
 */
export function exportToMarkdown(result: ChaosRunResult): string {
  const lines: string[] = [
    '# ActivitySlot Persistence Chaos Test Results',
    '',
    `**Timestamp:** ${result.timestamp}`,
    '',
    '## Summary',
    '',
    `- **Total Scenarios:** ${result.totalScenarios}`,
    `- **Passed:** ${result.passedScenarios}`,
    `- **Failed:** ${result.failedScenarios}`,
    `- **Success Rate:** ${((result.passedScenarios / result.totalScenarios) * 100).toFixed(1)}%`,
    `- **Total Events:** ${result.totalEvents}`,
    `- **Recovered Events:** ${result.recoveredEvents}`,
    `- **Recovery Rate:** ${((result.recoveredEvents / result.totalEvents) * 100).toFixed(1)}%`,
    `- **Average Data Integrity:** ${result.averageDataIntegrity.toFixed(1)}%`,
    `- **KPIs Met:** ${result.kpisMet ? '✓ Yes' : '✗ No'}`,
    '',
    '## Scenario Results',
    '',
  ];

  for (const scenarioResult of result.results) {
    lines.push(
      `### ${scenarioResult.success ? '✓' : '✗'} ${scenarioResult.scenarioId}`,
      '',
      `- **Duration:** ${scenarioResult.duration}ms`,
      `- **Events Triggered:** ${scenarioResult.eventsTriggered}`,
      `- **Events Recovered:** ${scenarioResult.eventsRecovered}`,
      `- **Data Integrity:** ${scenarioResult.dataIntegrityScore.toFixed(1)}%`,
      `- **Average Recovery Time:** ${scenarioResult.recoveryMetrics.averageRecoveryTimeMs.toFixed(0)}ms`,
      `- **Max Recovery Time:** ${scenarioResult.recoveryMetrics.maxRecoveryTimeMs.toFixed(0)}ms`,
      `- **Failed Recoveries:** ${scenarioResult.recoveryMetrics.failedRecoveries}`,
      ''
    );

    if (scenarioResult.errors.length > 0) {
      lines.push('**Errors:**', '');
      scenarioResult.errors.forEach(error => {
        lines.push(`- **${error.event}:** ${error.error}`);
      });
      lines.push('');
    }

    if (scenarioResult.mitigationsSuggested.length > 0) {
      lines.push('**Suggested Mitigations:**', '');
      scenarioResult.mitigationsSuggested.forEach(mitigation => {
        lines.push(`- ${mitigation}`);
      });
      lines.push('');
    }
  }

  if (result.suggestions.length > 0) {
    lines.push('## Overall Suggestions', '');
    result.suggestions.forEach(suggestion => {
      lines.push(`- ${suggestion}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
