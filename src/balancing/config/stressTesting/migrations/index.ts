/**
 * Stress Testing Configuration Migration Helpers
 * 
 * Helper functions and utilities for migrating legacy stress testing
 * configurations to the new Zod schema format.
 */

import { z } from 'zod';
import { StressTestingConfigSchema, type StressTestingConfig } from '../schema';

/**
 * Legacy configuration schemas for detection and migration
 */
export const LegacyConfigV1Schema = z.object({
  simulationCount: z.number().optional(),
  seed: z.number().optional(),
  opThreshold: z.number().optional(),
  weakThreshold: z.number().optional(),
  pointsPerWeight: z.number().optional(),
  includePairs: z.boolean().optional(),
  excludeDerived: z.boolean().optional(),
  minWeight: z.number().optional(),
  maxPairs: z.number().optional(),
  incompatiblePairs: z.array(z.tuple([z.string(), z.string()])).optional(),
});

export const LegacyConfigV0Schema = z.object({
  iterations: z.number().optional(),
  randomSeed: z.number().optional(),
  synergyThreshold: z.number().optional(),
  statPairs: z.array(z.any()).optional(),
});

export type LegacyConfigV1 = z.infer<typeof LegacyConfigV1Schema>;
export type LegacyConfigV0 = z.infer<typeof LegacyConfigV0Schema>;

/**
 * Migration result interface
 */
export interface MigrationResult {
  success: boolean;
  inputFile: string;
  outputFile: string;
  backupFile?: string;
  version: string;
  changes: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Detect legacy configuration version
 */
export function detectLegacyVersion(data: unknown): 'v1' | 'v0' | 'unknown' {
  try {
    const parsed = LegacyConfigV1Schema.safeParse(data);
    if (parsed.success) {
      // Check for v1 specific fields
      if ('simulationCount' in parsed.data || 'opThreshold' in parsed.data) {
        return 'v1';
      }
    }
  } catch {
    // Continue to v0 detection
  }

  try {
    const parsed = LegacyConfigV0Schema.safeParse(data);
    if (parsed.success) {
      return 'v0';
    }
  } catch {
    // Unknown format
  }

  return 'unknown';
}

/**
 * Migrate v1 legacy configuration to new schema
 */
export function migrateV1ToCurrent(legacy: LegacyConfigV1): StressTestingConfig {
  return {
    version: '1.0.0',
    thresholds: {
      opThreshold: legacy.opThreshold ?? 1.15,
      weakThreshold: legacy.weakThreshold ?? 0.95,
    },
    simulation: {
      simulationCount: legacy.simulationCount ?? 1000,
      concurrencyLimit: 10, // Default for v1 migrations
      seed: legacy.seed ?? 12345,
    },
    export: {
      enableJson: true,
      enableCsv: true,
      enableMarkdown: false,
      exportPath: './stress-test-results',
    },
    archetype: {
      pointsPerWeight: legacy.pointsPerWeight ?? 25,
      defaultSeed: legacy.seed ?? 12345,
      includePairs: legacy.includePairs ?? true,
      excludeDerived: legacy.excludeDerived ?? true,
      minWeight: legacy.minWeight ?? 0.5,
      maxPairs: legacy.maxPairs,
    },
    incompatiblePairs: legacy.incompatiblePairs ?? [],
    enablePersistence: true,
    enableTelemetry: true,
  };
}

/**
 * Migrate v0 legacy configuration to new schema
 */
export function migrateV0ToCurrent(legacy: LegacyConfigV0): StressTestingConfig {
  return {
    version: '1.0.0',
    thresholds: {
      opThreshold: 1.15, // Default for v0 migrations
      weakThreshold: 0.95,
    },
    simulation: {
      simulationCount: legacy.iterations ?? 1000,
      concurrencyLimit: 10, // Default for v0 migrations
      seed: legacy.randomSeed ?? 12345,
    },
    export: {
      enableJson: true,
      enableCsv: true,
      enableMarkdown: false,
      exportPath: './stress-test-results',
    },
    archetype: {
      pointsPerWeight: 25, // Default for v0 migrations
      defaultSeed: legacy.randomSeed ?? 12345,
      includePairs: true,
      excludeDerived: true,
      minWeight: 0.5,
      maxPairs: undefined,
    },
    incompatiblePairs: [], // v0 didn't have incompatible pairs
    enablePersistence: true,
    enableTelemetry: true,
  };
}

/**
 * Generate migration diff report
 */
export function generateDiff(legacy: unknown, current: StressTestingConfig, version: string): string[] {
  const changes: string[] = [];
  
  changes.push(`=== Migration Report: Legacy ${version} → Current 1.0.0 ===`);
  changes.push(`Timestamp: ${new Date().toISOString()}`);
  changes.push('');

  // Add structure changes
  if (version === 'v0') {
    changes.push('Structure Changes:');
    changes.push('- Added nested configuration structure (thresholds, simulation, export, archetype)');
    changes.push('- Added version field for migration tracking');
    changes.push('- Added enablePersistence and enableTelemetry flags');
    changes.push('- Renamed iterations → simulationCount');
    changes.push('- Renamed randomSeed → seed');
  } else if (version === 'v1') {
    changes.push('Structure Changes:');
    changes.push('- Added nested export configuration');
    changes.push('- Added version field for migration tracking');
    changes.push('- Added enablePersistence and enableTelemetry flags');
  }

  changes.push('');
  changes.push('Default Values Applied:');
  changes.push('- concurrencyLimit: 10 (default for migrations)');
  changes.push('- enableJson: true');
  changes.push('- enableCsv: true');
  changes.push('- enableMarkdown: false');
  changes.push('- exportPath: "./stress-test-results"');
  changes.push('- enablePersistence: true');
  changes.push('- enableTelemetry: true');

  if (version === 'v0') {
    changes.push('- opThreshold: 1.15 (default for v0)');
    changes.push('- weakThreshold: 0.95 (default for v0)');
    changes.push('- pointsPerWeight: 25 (default for v0)');
    changes.push('- includePairs: true (default for v0)');
    changes.push('- excludeDerived: true (default for v0)');
    changes.push('- minWeight: 0.5 (default for v0)');
  }

  return changes;
}

/**
 * Validate migrated configuration
 */
export function validateMigratedConfig(config: StressTestingConfig): { valid: boolean; errors: string[] } {
  const validation = StressTestingConfigSchema.safeParse(config);
  
  if (validation.success) {
    return { valid: true, errors: [] };
  }
  
  return {
    valid: false,
    errors: validation.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
  };
}

/**
 * Create migration summary
 */
export function createMigrationSummary(results: MigrationResult[]): {
  total: number;
  successful: number;
  failed: number;
  byVersion: Record<string, number>;
  errors: string[];
} {
  const summary = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    byVersion: {} as Record<string, number>,
    errors: [] as string[],
  };

  // Count by version
  results.forEach(result => {
    summary.byVersion[result.version] = (summary.byVersion[result.version] || 0) + 1;
    if (!result.success) {
      summary.errors.push(`${result.inputFile}: ${result.errors.join(', ')}`);
    }
  });

  return summary;
}
