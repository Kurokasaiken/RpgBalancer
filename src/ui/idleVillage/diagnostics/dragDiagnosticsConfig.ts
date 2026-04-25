import { z } from 'zod';

/**
 * Configuration schema for Idle Village Drag Diagnostics CLI
 * Defines drag scenarios, test parameters, and reporting options
 */

/**
 * Drag scenario types for Phase E validation testing
 */
export const DragScenarioTypeSchema = z.enum([
  'valid',
  'invalid', 
  'blocked',
  'warning'
]);

export type DragScenarioType = z.infer<typeof DragScenarioTypeSchema>;

/**
 * Individual drag scenario configuration
 */
export const DragScenarioSchema = z.object({
  /** Unique scenario identifier */
  id: z.string(),
  /** Human-readable scenario name */
  name: z.string(),
  /** Scenario type for categorization */
  type: DragScenarioTypeSchema,
  /** Scenario description */
  description: z.string(),
  /** Resident configuration for this scenario */
  resident: z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(['idle', 'working', 'resting', 'exhausted']),
    fatigue: z.number().min(0).max(100),
    statTags: z.array(z.string()),
    stats: z.record(z.number()),
  }),
  /** Target slot configuration */
  slot: z.object({
    id: z.string(),
    activityId: z.string(),
    name: z.string(),
    maxCapacity: z.number().min(1),
  }),
  /** Current assignments context */
  currentAssignments: z.record(z.string().nullable()),
  /** Expected validation result */
  expected: z.object({
    valid: z.boolean(),
    reason: z.string().optional(),
  }),
  /** Performance thresholds for this scenario */
  thresholds: z.object({
    maxLatencyMs: z.number().default(50),
    minSuccessRate: z.number().default(1.0),
  }).optional(),
  /** Number of iterations to run */
  iterations: z.number().min(1).default(10),
  /** Whether this scenario is enabled */
  enabled: z.boolean().default(true),
  /** Priority for execution (lower = higher) */
  priority: z.number().default(1),
});

export type DragScenario = z.infer<typeof DragScenarioSchema>;

/**
 * Test execution configuration
 */
export const DragDiagnosticsExecutionSchema = z.object({
  /** Whether to run scenarios in parallel */
  parallelExecution: z.boolean().default(true),
  /** Maximum concurrent operations */
  maxConcurrentOps: z.number().default(5),
  /** Timeout per scenario (ms) */
  scenarioTimeoutMs: z.number().default(10000),
  /** Whether to continue on first failure */
  continueOnFailure: z.boolean().default(false),
  /** Verbose logging output */
  verbose: z.boolean().default(false),
  /** Whether to capture performance metrics */
  captureMetrics: z.boolean().default(true),
  /** Whether to simulate drag via DOM harness */
  useDOMHarness: z.boolean().default(false),
});

export type DragDiagnosticsExecution = z.infer<typeof DragDiagnosticsExecutionSchema>;

/**
 * Output configuration
 */
export const DragDiagnosticsOutputSchema = z.object({
  /** Output directory for reports */
  outputDir: z.string().default('test-results'),
  /** Whether to create timestamped filenames */
  createTimestampedFilenames: z.boolean().default(true),
  /** Export formats to generate */
  formats: z.array(z.enum(['json', 'markdown', 'csv'])).default(['json', 'markdown']),
  /** Whether to include detailed results */
  includeDetailedResults: z.boolean().default(true),
  /** Whether to include performance metrics */
  includePerformanceMetrics: z.boolean().default(true),
  /** Whether to generate latency charts */
  generateLatencyChart: z.boolean().default(true),
  /** Whether to include raw logs */
  includeRawLogs: z.boolean().default(false),
});

export type DragDiagnosticsOutput = z.infer<typeof DragDiagnosticsOutputSchema>;

/**
 * Telemetry configuration
 */
export const DragDiagnosticsTelemetrySchema = z.object({
  /** Whether to emit telemetry events */
  enabled: z.boolean().default(true),
  /** Event name for telemetry */
  eventName: z.string().default('iv_drag_diagnostics_run'),
  /** Whether to track individual scenario results */
  trackScenarioResults: z.boolean().default(true),
  /** Whether to track performance metrics */
  trackPerformanceMetrics: z.boolean().default(true),
});

export type DragDiagnosticsTelemetry = z.infer<typeof DragDiagnosticsTelemetrySchema>;

/**
 * Main configuration schema
 */
export const DragDiagnosticsConfigSchema = z.object({
  /** Configuration name and description */
  name: z.string(),
  description: z.string(),
  /** Drag scenarios to test */
  scenarios: z.array(DragScenarioSchema),
  /** Execution parameters */
  execution: DragDiagnosticsExecutionSchema,
  /** Output configuration */
  output: DragDiagnosticsOutputSchema,
  /** Telemetry configuration */
  telemetry: DragDiagnosticsTelemetrySchema,
  /** Configuration metadata */
  version: z.string().default('1.0.0'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type DragDiagnosticsConfig = z.infer<typeof DragDiagnosticsConfigSchema>;

/**
 * Default drag diagnostics configuration
 */
export const DEFAULT_DRAG_DIAGNOSTICS_CONFIG: DragDiagnosticsConfig = {
  name: 'Idle Village Drag Diagnostics',
  description: 'Phase E drag/drop validation diagnostics for Idle Village',
  scenarios: [
    {
      id: 'valid-basic-drop',
      name: 'Valid Basic Drop',
      type: 'valid',
      description: 'Resident with matching stats dropped on appropriate activity',
      resident: {
        id: 'resident-001',
        name: 'Test Worker',
        status: 'idle',
        fatigue: 10,
        statTags: ['strength', 'endurance'],
        stats: { strength: 50, endurance: 45, agility: 30 },
      },
      slot: {
        id: 'forest-work',
        activityId: 'forest-work',
        name: 'Forest Work',
        maxCapacity: 3,
      },
      currentAssignments: {},
      expected: {
        valid: true,
      },
      thresholds: {
        maxLatencyMs: 50,
        minSuccessRate: 1.0,
      },
      iterations: 10,
      enabled: true,
      priority: 1,
    },
    {
      id: 'invalid-stat-mismatch',
      name: 'Invalid Stat Mismatch',
      type: 'invalid',
      description: 'Resident without required stats dropped on specialized activity',
      resident: {
        id: 'resident-002',
        name: 'Test Scholar',
        status: 'idle',
        fatigue: 5,
        statTags: ['intelligence', 'wisdom'],
        stats: { intelligence: 60, wisdom: 55, charisma: 40 },
      },
      slot: {
        id: 'mining-operation',
        activityId: 'mining-operation',
        name: 'Mining Operation',
        maxCapacity: 2,
      },
      currentAssignments: {},
      expected: {
        valid: false,
        reason: 'Missing required stat tags: strength',
      },
      thresholds: {
        maxLatencyMs: 50,
        minSuccessRate: 1.0,
      },
      iterations: 10,
      enabled: true,
      priority: 2,
    },
    {
      id: 'blocked-fatigue-limit',
      name: 'Blocked by Fatigue',
      type: 'blocked',
      description: 'Exhausted resident cannot be assigned to work',
      resident: {
        id: 'resident-003',
        name: 'Tired Worker',
        status: 'exhausted',
        fatigue: 95,
        statTags: ['strength', 'endurance'],
        stats: { strength: 40, endurance: 35, agility: 25 },
      },
      slot: {
        id: 'forest-work',
        activityId: 'forest-work',
        name: 'Forest Work',
        maxCapacity: 3,
      },
      currentAssignments: {},
      expected: {
        valid: false,
        reason: 'Resident fatigue exceeds threshold',
      },
      thresholds: {
        maxLatencyMs: 50,
        minSuccessRate: 1.0,
      },
      iterations: 10,
      enabled: true,
      priority: 3,
    },
    {
      id: 'warning-crew-limit',
      name: 'Warning - Crew Limit',
      type: 'warning',
      description: 'Activity at capacity but allows override',
      resident: {
        id: 'resident-004',
        name: 'Additional Worker',
        status: 'idle',
        fatigue: 20,
        statTags: ['strength', 'endurance'],
        stats: { strength: 45, endurance: 40, agility: 30 },
      },
      slot: {
        id: 'crafting-station',
        activityId: 'crafting-station',
        name: 'Crafting Station',
        maxCapacity: 2,
      },
      currentAssignments: {
        'crafting-station-1': 'resident-005',
        'crafting-station-2': 'resident-006',
      },
      expected: {
        valid: false,
        reason: 'Activity at maximum capacity',
      },
      thresholds: {
        maxLatencyMs: 50,
        minSuccessRate: 1.0,
      },
      iterations: 10,
      enabled: true,
      priority: 4,
    },
  ],
  execution: {
    parallelExecution: true,
    maxConcurrentOps: 5,
    scenarioTimeoutMs: 10000,
    continueOnFailure: false,
    verbose: false,
    captureMetrics: true,
    useDOMHarness: false,
  },
  output: {
    outputDir: 'test-results',
    createTimestampedFilenames: true,
    formats: ['json', 'markdown', 'csv'],
    includeDetailedResults: true,
    includePerformanceMetrics: true,
    generateLatencyChart: true,
    includeRawLogs: false,
  },
  telemetry: {
    enabled: true,
    eventName: 'iv_drag_diagnostics_run',
    trackScenarioResults: true,
    trackPerformanceMetrics: true,
  },
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Preset configurations for different testing scenarios
 */
export const DRAG_DIAGNOSTICS_PRESETS = {
  /** Quick validation for CI/CD pipelines */
  quick: {
    ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG,
    name: 'Quick Drag Diagnostics',
    description: 'Fast validation for CI/CD pipelines',
    scenarios: DEFAULT_DRAG_DIAGNOSTICS_CONFIG.scenarios.slice(0, 2), // Only first 2 scenarios
    execution: {
      ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG.execution,
      parallelExecution: false,
      maxConcurrentOps: 1,
      scenarioTimeoutMs: 5000,
    },
  },
  /** Comprehensive testing for release validation */
  comprehensive: {
    ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG,
    name: 'Comprehensive Drag Diagnostics',
    description: 'Full validation suite for release testing',
    execution: {
      ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG.execution,
      parallelExecution: true,
      maxConcurrentOps: 3,
      scenarioTimeoutMs: 15000,
      verbose: true,
    },
  },
  /** Performance-focused testing */
  performance: {
    ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG,
    name: 'Performance Drag Diagnostics',
    description: 'Performance and latency testing',
    execution: {
      ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG.execution,
      parallelExecution: true,
      maxConcurrentOps: 10,
      captureMetrics: true,
      useDOMHarness: true,
    },
    thresholds: {
      maxLatencyMs: 25, // Stricter performance requirements
      minSuccessRate: 1.0,
    },
    output: {
      ...DEFAULT_DRAG_DIAGNOSTICS_CONFIG.output,
      generateLatencyChart: true,
      includePerformanceMetrics: true,
    },
  },
} as const;

export type DragDiagnosticsPreset = keyof typeof DRAG_DIAGNOSTICS_PRESETS;
