/**
 * Stress Testing Configuration Schema
 * 
 * Zod schema definitions for Phase 10.5 stress testing configuration
 * with validation, defaults, and type safety.
 */

import { z } from 'zod';

/**
 * Schema for synergy thresholds configuration
 */
export const SynergyThresholdsSchema = z.object({
  /** Threshold for identifying overpowered synergies (> this multiplier) */
  opThreshold: z.number().min(1.0).max(10.0).default(1.15),
  /** Threshold for identifying weak synergies (< this multiplier) */
  weakThreshold: z.number().min(0.1).max(1.0).default(0.95),
});

/**
 * Schema for simulation configuration parameters
 */
export const SimulationConfigSchema = z.object({
  /** Number of Monte Carlo simulations per archetype pair */
  simulationCount: z.number().min(100).max(100000).default(1000),
  /** Maximum concurrent simulations to prevent memory issues */
  concurrencyLimit: z.number().min(1).max(100).default(10),
  /** Random seed for deterministic results */
  seed: z.number().int().min(0).max(2147483647).default(12345),
});

/**
 * Schema for export configuration
 */
export const ExportConfigSchema = z.object({
  /** Enable JSON export */
  enableJson: z.boolean().default(true),
  /** Enable CSV export */
  enableCsv: z.boolean().default(true),
  /** Enable Markdown export */
  enableMarkdown: z.boolean().default(false),
  /** Export directory path */
  exportPath: z.string().default('./stress-test-results'),
});

/**
 * Schema for archetype generation configuration
 */
export const ArchetypeConfigSchema = z.object({
  /** Base points multiplier for stat adjustments */
  pointsPerWeight: z.number().min(1).max(100).default(25),
  /** Default random seed for deterministic generation */
  defaultSeed: z.number().int().min(0).max(2147483647).default(12345),
  /** Include pair-stat combinations */
  includePairs: z.boolean().default(true),
  /** Filter out derived stats */
  excludeDerived: z.boolean().default(true),
  /** Minimum weight threshold for inclusion */
  minWeight: z.number().min(0.1).max(10.0).default(0.5),
  /** Maximum number of pair combinations (to limit combinatorial explosion) */
  maxPairs: z.number().min(1).max(1000).optional(),
});

/**
 * Schema for incompatible stat pairs
 */
export const IncompatibleStatPairsSchema = z.array(z.tuple([
  z.string().min(1),
  z.string().min(1)
])).default([]);

/**
 * Complete stress testing configuration schema
 */
export const StressTestingConfigSchema = z.object({
  /** Synergy analysis thresholds */
  thresholds: SynergyThresholdsSchema,
  /** Simulation parameters */
  simulation: SimulationConfigSchema,
  /** Export configuration */
  export: ExportConfigSchema,
  /** Archetype generation configuration */
  archetype: ArchetypeConfigSchema,
  /** Incompatible stat pairs to avoid */
  incompatiblePairs: IncompatibleStatPairsSchema,
  /** Enable persistence of results */
  enablePersistence: z.boolean().default(true),
  /** Enable telemetry collection */
  enableTelemetry: z.boolean().default(true),
  /** Configuration version for migration support */
  version: z.string().default('1.0.0'),
});

/**
 * Type inference from schema
 */
export type StressTestingConfig = z.infer<typeof StressTestingConfigSchema>;
export type SynergyThresholds = z.infer<typeof SynergyThresholdsSchema>;
export type SimulationConfig = z.infer<typeof SimulationConfigSchema>;
export type ExportConfig = z.infer<typeof ExportConfigSchema>;
export type ArchetypeConfig = z.infer<typeof ArchetypeConfigSchema>;
export type IncompatibleStatPairs = z.infer<typeof IncompatibleStatPairsSchema>;

/**
 * Default stress testing configuration
 */
export const DEFAULT_STRESS_TESTING_CONFIG: StressTestingConfig = {
  thresholds: {
    opThreshold: 1.15,
    weakThreshold: 0.95,
  },
  simulation: {
    simulationCount: 1000,
    concurrencyLimit: 10,
    seed: 12345,
  },
  export: {
    enableJson: true,
    enableCsv: true,
    enableMarkdown: false,
    exportPath: './stress-test-results',
  },
  archetype: {
    pointsPerWeight: 25,
    defaultSeed: 12345,
    includePairs: true,
    excludeDerived: true,
    minWeight: 0.5,
    maxPairs: undefined,
  },
  incompatiblePairs: [
    // Defensive + offensive combinations
    ['hp', 'damage'],
    ['armor', 'damage'],
    ['hp', 'crit'],
    
    // Speed + defensive (gameplay balance)
    ['speed', 'armor'],
    ['speed', 'hp'],
    
    // Derived stat conflicts
    ['hit_chance', 'dodge'],
    ['crit_chance', 'dodge'],
  ],
  enablePersistence: true,
  enableTelemetry: true,
  version: '1.0.0',
};

/**
 * Configuration validation helper
 */
export function validateStressTestingConfig(config: unknown): StressTestingConfig {
  return StressTestingConfigSchema.parse(config);
}

/**
 * Configuration merger with validation
 */
export function mergeStressTestingConfig(
  base: StressTestingConfig,
  override: Partial<StressTestingConfig>
): StressTestingConfig {
  const merged = { ...base, ...override };
  
  // Deep merge nested objects
  if (override.thresholds) {
    merged.thresholds = { ...base.thresholds, ...override.thresholds };
  }
  if (override.simulation) {
    merged.simulation = { ...base.simulation, ...override.simulation };
  }
  if (override.export) {
    merged.export = { ...base.export, ...override.export };
  }
  if (override.archetype) {
    merged.archetype = { ...base.archetype, ...override.archetype };
  }
  if (override.incompatiblePairs) {
    merged.incompatiblePairs = override.incompatiblePairs;
  }
  
  return validateStressTestingConfig(merged);
}
