/**
 * Legacy Config Migration Tooling for Phase 10.5
 * 
 * Comprehensive migration system for transforming legacy balancer configurations
 * to the new config-driven format with validation, rollback, and reporting capabilities.
 */

import { z } from 'zod';
import type { BalancerConfig, StatDefinition, CardDefinition, BalancerPreset } from '../types';
import { BalancerConfigSchema } from '../schemas';
import { DEFAULT_CONFIG } from '../defaultConfig';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

/**
 * Migration version information
 */
export interface MigrationVersion {
  version: string;
  timestamp: string;
  description: string;
  breaking: boolean;
}

/**
 * Legacy configuration schemas for different versions
 */

// Pre-Phase 10 legacy format (hardcoded stats)
export const LegacyPrePhase10Schema = z.object({
  version: z.string().optional(),
  stats: z.record(z.object({
    id: z.string(),
    label: z.string(),
    weight: z.number(),
    min: z.number().optional(),
    max: z.number().optional(),
    defaultValue: z.number().optional(),
  })).optional(),
  cards: z.record(z.object({
    id: z.string(),
    title: z.string(),
    color: z.string(),
    statIds: z.array(z.string()).optional(),
  })).optional(),
  presets: z.record(z.object({
    name: z.string(),
    weights: z.record(z.number()),
  })).optional(),
});

// Phase 10 early format (partial config-driven)
export const LegacyPhase10V0Schema = z.object({
  version: z.string().optional(),
  stats: z.record(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    type: z.enum(['number', 'percentage']).optional(),
    min: z.number(),
    max: z.number(),
    step: z.number(),
    defaultValue: z.number(),
    weight: z.number(),
    isCore: z.boolean().optional(),
    isDerived: z.boolean().optional(),
    formula: z.string().optional(),
  })).optional(),
  cards: z.record(z.object({
    id: z.string(),
    title: z.string(),
    color: z.string(),
    icon: z.string().optional(),
    statIds: z.array(z.string()),
    isCore: z.boolean().optional(),
    order: z.number().optional(),
  })).optional(),
});

// Phase 10.1 format (with enhanced metadata)
export const LegacyPhase10V1Schema = z.object({
  version: z.string(),
  stats: z.record(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    type: z.enum(['number', 'percentage']),
    min: z.number(),
    max: z.number(),
    step: z.number(),
    defaultValue: z.number(),
    weight: z.number(),
    isCore: z.boolean(),
    isDerived: z.boolean(),
    formula: z.string().optional(),
    bgColor: z.string().optional(),
    isLocked: z.boolean().optional(),
    isHidden: z.boolean().optional(),
    icon: z.string().optional(),
    isPenalty: z.boolean().optional(),
    baseStat: z.boolean().optional(),
    isDetrimental: z.boolean().optional(),
  })),
  cards: z.record(z.object({
    id: z.string(),
    title: z.string(),
    color: z.string(),
    icon: z.string().optional(),
    statIds: z.array(z.string()),
    isCore: z.boolean(),
    order: z.number(),
    isLocked: z.boolean().optional(),
    isHidden: z.boolean().optional(),
  })),
  presets: z.record(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    weights: z.record(z.number()),
    metadata: z.record(z.unknown()).optional(),
  })),
});

export type LegacyPrePhase10 = z.infer<typeof LegacyPrePhase10Schema>;
export type LegacyPhase10V0 = z.infer<typeof LegacyPhase10V0Schema>;
export type LegacyPhase10V1 = z.infer<typeof LegacyPhase10V1Schema>;

/**
 * Migration result interface
 */
export interface MigrationResult {
  success: boolean;
  sourceVersion: string;
  targetVersion: string;
  inputFile: string;
  outputFile: string;
  backupFile?: string;
  changes: MigrationChange[];
  errors: string[];
  warnings: string[];
  duration: number;
}

export interface MigrationChange {
  type: 'added' | 'removed' | 'modified' | 'moved';
  category: 'stat' | 'card' | 'preset' | 'metadata';
  id: string;
  description: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Migration transformation functions
 */

/**
 * Migrate pre-Phase 10 hardcoded config to new format
 */
export function migratePrePhase10ToCurrent(legacy: LegacyPrePhase10): BalancerConfig {
  const stats: Record<string, StatDefinition> = {};
  const cards: Record<string, CardDefinition> = {};
  const presets: Record<string, BalancerPreset> = {};

  // Migrate stats with full property completion
  if (legacy.stats) {
    Object.entries(legacy.stats).forEach(([id, stat]) => {
      const isCore = ['hp', 'damage', 'htk'].includes(id);
      
      stats[id] = {
        id,
        label: stat.label,
        description: `Migrated stat: ${stat.label}`,
        type: 'number',
        min: stat.min ?? 0,
        max: stat.max ?? 100,
        step: 1,
        defaultValue: stat.defaultValue ?? 0,
        weight: stat.weight,
        isCore,
        isDerived: id === 'htk',
        formula: id === 'htk' ? 'hp / damage' : undefined,
        bgColor: isCore ? 'bg-blue-500/10' : 'bg-gray-500/10',
        isLocked: false,
        isHidden: false,
        baseStat: !isCore && !stat.label.includes('derived'),
      };
    });
  }

  // Ensure core stats exist
  const coreStats = ['hp', 'damage', 'htk'];
  coreStats.forEach(statId => {
    if (!stats[statId]) {
      stats[statId] = DEFAULT_CONFIG.stats[statId];
    }
  });

  // Migrate cards
  if (legacy.cards) {
    Object.entries(legacy.cards).forEach(([id, card], index) => {
      cards[id] = {
        id,
        title: card.title,
        color: card.color,
        icon: '📊',
        statIds: card.statIds || [],
        isCore: false,
        order: index,
        isLocked: false,
        isHidden: false,
      };
    });
  }

  // Migrate presets
  if (legacy.presets) {
    Object.entries(legacy.presets).forEach(([id, preset]) => {
      presets[id] = {
        id,
        name: preset.name,
        description: `Migrated preset: ${preset.name}`,
        weights: preset.weights,
        metadata: {
          migrated: true,
          sourceVersion: 'pre-phase10',
        },
      };
    });
  }

  return {
    version: '1.0.0',
    stats,
    cards,
    presets,
    metadata: {
      migrated: true,
      sourceVersion: 'pre-phase10',
      migrationDate: new Date().toISOString(),
    },
  };
}

/**
 * Migrate Phase 10 V0 to current format
 */
export function migratePhase10V0ToCurrent(legacy: LegacyPhase10V0): BalancerConfig {
  const stats: Record<string, StatDefinition> = {};
  const cards: Record<string, CardDefinition> = {};
  const presets: Record<string, BalancerPreset> = {};

  // Migrate stats with property completion
  if (legacy.stats) {
    Object.entries(legacy.stats).forEach(([id, stat]) => {
      stats[id] = {
        id,
        label: stat.label,
        description: stat.description || `Stat: ${stat.label}`,
        type: stat.type || 'number',
        min: stat.min,
        max: stat.max,
        step: stat.step,
        defaultValue: stat.defaultValue,
        weight: stat.weight,
        isCore: stat.isCore ?? false,
        isDerived: stat.isDerived ?? false,
        formula: stat.formula,
        bgColor: stat.isCore ? 'bg-blue-500/10' : 'bg-gray-500/10',
        isLocked: false,
        isHidden: false,
        baseStat: !stat.isDerived && !stat.isCore,
      };
    });
  }

  // Migrate cards
  if (legacy.cards) {
    Object.entries(legacy.cards).forEach(([id, card], index) => {
      cards[id] = {
        id,
        title: card.title,
        color: card.color,
        icon: card.icon || '📊',
        statIds: card.statIds || [],
        isCore: card.isCore ?? false,
        order: card.order ?? index,
        isLocked: false,
        isHidden: false,
      };
    });
  }

  return {
    version: '1.0.0',
    stats,
    cards,
    presets,
    metadata: {
      migrated: true,
      sourceVersion: 'phase10-v0',
      migrationDate: new Date().toISOString(),
    },
  };
}

/**
 * Migrate Phase 10 V1 to current format (mostly validation)
 */
export function migratePhase10V1ToCurrent(legacy: LegacyPhase10V1): BalancerConfig {
  // V1 is very close to current, just ensure schema compliance
  return {
    version: '1.0.0',
    stats: legacy.stats,
    cards: legacy.cards,
    presets: legacy.presets,
    metadata: {
      migrated: true,
      sourceVersion: 'phase10-v1',
      migrationDate: new Date().toISOString(),
    },
  };
}

/**
 * Main migration engine class
 */
export class ConfigMigrator {
  private static readonly MIGRATION_PATHS = {
    'pre-phase10': migratePrePhase10ToCurrent,
    'phase10-v0': migratePhase10V0ToCurrent,
    'phase10-v1': migratePhase10V1ToCurrent,
  };

  /**
   * Detect the version of a legacy configuration
   */
  static detectVersion(data: unknown): string {
    // Try Phase 10 V1 first (most specific)
    try {
      const parsed = LegacyPhase10V1Schema.safeParse(data);
      if (parsed.success && parsed.data.version) {
        return 'phase10-v1';
      }
    } catch {
      // Continue detection
    }

    // Try Phase 10 V0
    try {
      const parsed = LegacyPhase10V0Schema.safeParse(data);
      if (parsed.success) {
        return 'phase10-v0';
      }
    } catch {
      // Continue detection
    }

    // Try Pre-Phase 10
    try {
      const parsed = LegacyPrePhase10Schema.safeParse(data);
      if (parsed.success) {
        return 'pre-phase10';
      }
    } catch {
      // Continue detection
    }

    return 'unknown';
  }

  /**
   * Validate a configuration against the current schema
   */
  static validateConfig(config: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const result = BalancerConfigSchema.safeParse(config);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          errors.push(`${issue.path.join('.')}: ${issue.message}`);
        });
      }
    } catch (e) {
      errors.push(`Schema validation error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate migration changes report
   */
  static generateChanges(legacy: unknown, current: BalancerConfig, version: string): MigrationChange[] {
    const changes: MigrationChange[] = [];

    // Compare stats
    if (version === 'pre-phase10') {
      const legacyData = legacy as LegacyPrePhase10;
      
      // Check for new core stats
      const coreStats = ['hp', 'damage', 'htk'];
      coreStats.forEach(statId => {
        if (!legacyData.stats?.[statId]) {
          changes.push({
            type: 'added',
            category: 'stat',
            id: statId,
            description: `Added core stat '${statId}' with default configuration`,
            newValue: current.stats[statId],
          });
        }
      });

      // Check for property additions
      if (legacyData.stats) {
        Object.entries(legacyData.stats).forEach(([id, legacyStat]) => {
          const currentStat = current.stats[id];
          if (currentStat) {
            // Check for new properties
            const newProps = [
              'description', 'type', 'step', 'isCore', 'isDerived', 
              'bgColor', 'isLocked', 'isHidden', 'baseStat'
            ];
            
            newProps.forEach(prop => {
              if (!(prop in legacyStat) && (prop in currentStat)) {
                changes.push({
                  type: 'added',
                  category: 'stat',
                  id: `${id}.${prop}`,
                  description: `Added property '${prop}' to stat '${id}'`,
                  newValue: (currentStat as any)[prop],
                });
              }
            });
          }
        });
      }
    }

    // Add metadata changes
    changes.push({
      type: 'added',
      category: 'metadata',
      id: 'migration',
      description: 'Added migration metadata',
      newValue: current.metadata,
    });

    return changes;
  }

  /**
   * Perform migration from legacy to current format
   */
  static async migrate(
    inputFile: string,
    outputFile?: string,
    options: {
      createBackup?: boolean;
      dryRun?: boolean;
      force?: boolean;
    } = {}
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const {
      createBackup = true,
      dryRun = false,
      force = false,
    } = options;

    const result: MigrationResult = {
      success: false,
      sourceVersion: 'unknown',
      targetVersion: '1.0.0',
      inputFile,
      outputFile: outputFile || `${inputFile}.migrated`,
      changes: [],
      errors: [],
      warnings: [],
      duration: 0,
    };

    try {
      // Load legacy configuration
      const legacyData = await loadData(inputFile);
      
      // Detect version
      result.sourceVersion = this.detectVersion(legacyData);
      
      if (result.sourceVersion === 'unknown') {
        result.errors.push('Unable to detect configuration version');
        return result;
      }

      // Check if already current format
      if (result.sourceVersion === 'phase10-v1' && !force) {
        const validation = this.validateConfig(legacyData);
        if (validation.valid) {
          result.warnings.push('Configuration is already in current format');
          result.success = true;
          return result;
        }
      }

      // Create backup if requested
      if (createBackup && !dryRun) {
        const backupFile = `${inputFile}.backup.${Date.now()}`;
        await saveData(backupFile, legacyData);
        result.backupFile = backupFile;
      }

      // Perform migration
      const migrateFunction = this.MIGRATION_PATHS[result.sourceVersion as keyof typeof this.MIGRATION_PATHS];
      if (!migrateFunction) {
        result.errors.push(`No migration function found for version ${result.sourceVersion}`);
        return result;
      }

      const migratedConfig = migrateFunction(legacyData as any);

      // Validate migrated config
      const validation = this.validateConfig(migratedConfig);
      if (!validation.valid) {
        result.errors.push(...validation.errors);
        return result;
      }

      // Generate changes report
      result.changes = this.generateChanges(legacyData, migratedConfig, result.sourceVersion);

      // Save migrated config
      if (!dryRun) {
        await saveData(result.outputFile, migratedConfig);
      }

      result.success = true;
      result.warnings.push(`Successfully migrated from ${result.sourceVersion} to ${result.targetVersion}`);

    } catch (error) {
      result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Rollback a migration using backup file
   */
  static async rollback(backupFile: string, targetFile: string): Promise<{ success: boolean; error?: string }> {
    try {
      const backupData = await loadData(backupFile);
      await saveData(targetFile, backupData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Batch migrate multiple configuration files
   */
  static async batchMigrate(
    inputFiles: string[],
    options: {
      outputDir?: string;
      createBackup?: boolean;
      dryRun?: boolean;
      parallel?: boolean;
    } = {}
  ): Promise<MigrationResult[]> {
    const {
      outputDir,
      createBackup = true,
      dryRun = false,
      parallel = false,
    } = options;

    const migrateFile = async (inputFile: string): Promise<MigrationResult> => {
      const outputFile = outputDir 
        ? `${outputDir}/${inputFile.split('/').pop()}.migrated`
        : `${inputFile}.migrated`;
      
      return this.migrate(inputFile, outputFile, { createBackup, dryRun });
    };

    if (parallel) {
      return Promise.all(inputFiles.map(migrateFile));
    } else {
      const results: MigrationResult[] = [];
      for (const file of inputFiles) {
        results.push(await migrateFile(file));
      }
      return results;
    }
  }

  /**
   * Generate migration report
   */
  static generateReport(results: MigrationResult[]): string {
    const lines: string[] = [];
    
    lines.push('# Config Migration Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Summary
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = total - successful;
    
    lines.push('## Summary');
    lines.push(`- Total files: ${total}`);
    lines.push(`- Successful: ${successful}`);
    lines.push(`- Failed: ${failed}`);
    lines.push(`- Success rate: ${((successful / total) * 100).toFixed(1)}%`);
    lines.push('');

    // Individual results
    lines.push('## Individual Results');
    results.forEach((result, index) => {
      lines.push(`### ${index + 1}. ${result.inputFile}`);
      lines.push(`- Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
      lines.push(`- Version: ${result.sourceVersion} → ${result.targetVersion}`);
      lines.push(`- Duration: ${result.duration}ms`);
      lines.push(`- Changes: ${result.changes.length}`);
      
      if (result.errors.length > 0) {
        lines.push('- Errors:');
        result.errors.forEach(error => lines.push(`  - ${error}`));
      }
      
      if (result.warnings.length > 0) {
        lines.push('- Warnings:');
        result.warnings.forEach(warning => lines.push(`  - ${warning}`));
      }
      
      lines.push('');
    });

    // Changes summary
    const allChanges = results.flatMap(r => r.changes);
    const changesByType = allChanges.reduce((acc, change) => {
      acc[change.type] = (acc[change.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    lines.push('## Changes Summary');
    Object.entries(changesByType).forEach(([type, count]) => {
      lines.push(`- ${type}: ${count}`);
    });

    return lines.join('\n');
  }
}
