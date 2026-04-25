/**
 * Zod schema for drop stress replay dataset validation.
 * 
 * This file defines the data structures used for stress testing
 * the Idle Village drop validation system with thousands of scenarios.
 */

import { z } from 'zod';

export { z };

/**
 * Individual drop scenario data structure
 */
export const DropScenarioSchema = z.object({
  /** Unique identifier for the scenario */
  id: z.string(),
  /** Seed for deterministic random generation */
  seed: z.number().int().min(0),
  /** Resident statistics for this scenario */
  residentStats: z.object({
    id: z.string(),
    name: z.string(),
    level: z.number().int().min(1),
    stats: z.record(z.string(), z.number()),
    fatigue: z.number().min(0).max(100),
    tags: z.array(z.string()),
  }),
  /** Target slot information */
  slotInfo: z.object({
    id: z.string(),
    type: z.enum(['activity', 'location']),
    name: z.string(),
    capacity: z.number().int().min(1),
    currentOccupants: z.number().int().min(0),
    requirements: z.record(z.unknown()),
  }),
  /** Expected validation verdict */
  expectedVerdict: z.object({
    valid: z.boolean(),
    reason: z.string(),
    confidence: z.number().min(0).max(1),
    ruleViolations: z.array(z.string()),
  }),
  /** Metadata for the scenario */
  metadata: z.object({
    category: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'extreme']),
    description: z.string(),
    tags: z.array(z.string()),
    created: z.string(),
  }),
});

/**
 * Complete drop stress dataset
 */
export const DropStressDatasetSchema = z.object({
  /** Dataset metadata */
  metadata: z.object({
    name: z.string(),
    version: z.string(),
    description: z.string(),
    totalScenarios: z.number().int().min(1),
    created: z.string(),
    updated: z.string(),
    tags: z.array(z.string()),
  }),
  /** Array of drop scenarios */
  scenarios: z.array(DropScenarioSchema),
  /** Performance benchmarks */
  benchmarks: z.object({
    maxLatencyMs: z.number().min(0),
    minAccuracyRate: z.number().min(0).max(1),
    maxMemoryUsageMB: z.number().min(0),
  }),
});

/**
 * Export type definitions
 */
export type DropScenario = z.infer<typeof DropScenarioSchema>;
export type DropStressDataset = z.infer<typeof DropStressDatasetSchema>;

/**
 * Default empty dataset
 */
export const DEFAULT_DROP_STRESS_DATASET: DropStressDataset = {
  metadata: {
    name: 'Idle Village Drop Stress Dataset',
    version: '1.0.0',
    description: 'Comprehensive dataset for drop validation stress testing',
    totalScenarios: 0,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    tags: ['stress-test', 'drop-validation', 'idle-village'],
  },
  scenarios: [],
  benchmarks: {
    maxLatencyMs: 100,
    minAccuracyRate: 0.95,
    maxMemoryUsageMB: 50,
  },
};

/**
 * Validation helper functions
 */
export const validateDropScenario = (scenario: unknown): DropScenario => {
  return DropScenarioSchema.parse(scenario);
};

export const validateDropStressDataset = (dataset: unknown): DropStressDataset => {
  return DropStressDatasetSchema.parse(dataset);
};

/**
 * Schema exports
 */
export const DROP_STRESS_SCHEMAS = {
  DropScenario: DropScenarioSchema,
  DropStressDataset: DropStressDatasetSchema,
} as const;
