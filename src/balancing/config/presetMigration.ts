/**
 * Config Balancer Card Preset Migrator
 *
 * Versioned migration system for transforming legacy card presets (pre Phase 10)
 * to the current BalancerPreset schema with automatic backups, diff documentation,
 * and CLI integration.
 *
 * @module presetMigration
 * @since 2026-01-13
 * @author Cascade
 */

import { z } from 'zod';
import type { BalancerPreset } from '../types';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { createHash } from 'crypto';

/**
 * Migration version information for presets
 */
export interface PresetMigrationVersion {
  version: string;
  timestamp: string;
  description: string;
  breaking: boolean;
}

/**
 * Legacy preset schemas for different versions
 */

// Pre-Phase 10 legacy format (minimal structure)
export const LegacyPresetV1Schema = z.object({
  name: z.string(),
  weights: z.record(z.number()),
  description: z.string().optional(),
  isBuiltIn: z.boolean().optional(),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
});

// Phase 10 early format (partial metadata)
export const LegacyPresetV2Schema = z.object({
  id: z.string().optional(), // May not have ID yet
  name: z.string(),
  description: z.string(),
  weights: z.record(z.number()),
  isBuiltIn: z.boolean(),
  createdAt: z.string().optional(),
  modifiedAt: z.string().optional(),
});

/**
 * Current preset schema (Phase 10.5+)
 */
export const CurrentPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  weights: z.record(z.number()),
  isBuiltIn: z.boolean(),
  createdAt: z.string(),
  modifiedAt: z.string(),
});

/**
 * Migration result information
 */
export interface PresetMigrationResult {
  success: boolean;
  sourceVersion: string;
  targetVersion: string;
  inputFile: string;
  outputFile: string;
  presetId: string;
  presetName: string;
  changes: PresetMigrationChange[];
  errors: string[];
  warnings: string[];
  duration: number;
  backupFile?: string;
}

/**
 * Individual change in migration
 */
export interface PresetMigrationChange {
  type: 'added' | 'modified' | 'removed';
  property: string;
  description: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Preset Migration Manager
 */
export class PresetMigrator {
  private static readonly TARGET_VERSION = '3.0.0';
  private static readonly BACKUP_DIR = 'data/presets/balancer/backups';

  /**
   * Migration functions for different versions
   */
  private static readonly MIGRATION_PATHS = {
    'v1': PresetMigrator.migrateV1ToV2,
    'v2': PresetMigrator.migrateV2ToV3,
  };

  /**
   * Detect preset version from data structure
   */
  static detectVersion(data: unknown): string {
    // Try current schema first
    const currentResult = CurrentPresetSchema.safeParse(data);
    if (currentResult.success) {
      return 'v3';
    }

    // Try v2 schema
    const v2Result = LegacyPresetV2Schema.safeParse(data);
    if (v2Result.success) {
      return 'v2';
    }

    // Try v1 schema
    const v1Result = LegacyPresetV1Schema.safeParse(data);
    if (v1Result.success) {
      return 'v1';
    }

    return 'unknown';
  }

  /**
   * Validate a preset configuration
   */
  static validatePreset(data: unknown): { valid: boolean; errors: string[] } {
    const result = CurrentPresetSchema.safeParse(data);
    if (result.success) {
      return { valid: true, errors: [] };
    }

    return {
      valid: false,
      errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    };
  }

  /**
   * Migrate from V1 to V2 format
   */
  private static migrateV1ToV2(legacy: z.infer<typeof LegacyPresetV1Schema>): z.infer<typeof LegacyPresetV2Schema> {
    const migrated: z.infer<typeof LegacyPresetV2Schema> = {
      id: `preset_${createHash('md5').update(JSON.stringify(legacy)).digest('hex').substring(0, 8)}`,
      name: legacy.name,
      description: legacy.description || `Migrated preset: ${legacy.name}`,
      weights: legacy.weights,
      isBuiltIn: legacy.isBuiltIn || false,
      createdAt: legacy.createdAt || new Date().toISOString(),
      modifiedAt: legacy.modifiedAt || new Date().toISOString(),
    };

    return migrated;
  }

  /**
   * Migrate from V2 to V3 (current) format
   */
  private static migrateV2ToV3(legacy: z.infer<typeof LegacyPresetV2Schema>): z.infer<typeof CurrentPresetSchema> {
    // V2 and V3 are structurally identical, but ensure all required fields
    const migrated: z.infer<typeof CurrentPresetSchema> = {
      id: legacy.id || `preset_${createHash('md5').update(JSON.stringify(legacy)).digest('hex').substring(0, 8)}`,
      name: legacy.name,
      description: legacy.description,
      weights: legacy.weights,
      isBuiltIn: legacy.isBuiltIn,
      createdAt: legacy.createdAt || new Date().toISOString(),
      modifiedAt: legacy.modifiedAt || new Date().toISOString(),
    };

    return migrated;
  }

  /**
   * Generate detailed change log for migration
   */
  static generateChanges(
    legacy: unknown,
    migrated: z.infer<typeof CurrentPresetSchema>,
    sourceVersion: string
  ): PresetMigrationChange[] {
    const changes: PresetMigrationChange[] = [];

    if (sourceVersion === 'v1') {
      const legacyData = legacy as z.infer<typeof LegacyPresetV1Schema>;

      // Added ID field
      if (!legacyData.hasOwnProperty('id')) {
        changes.push({
          type: 'added',
          property: 'id',
          description: 'Added unique preset identifier',
          newValue: migrated.id,
        });
      }

      // Added description if missing
      if (!legacyData.description) {
        changes.push({
          type: 'added',
          property: 'description',
          description: 'Added default description',
          newValue: migrated.description,
        });
      }

      // Added isBuiltIn if missing
      if (!legacyData.hasOwnProperty('isBuiltIn')) {
        changes.push({
          type: 'added',
          property: 'isBuiltIn',
          description: 'Added built-in flag (default: false)',
          newValue: migrated.isBuiltIn,
        });
      }

      // Added timestamps
      if (!legacyData.createdAt) {
        changes.push({
          type: 'added',
          property: 'createdAt',
          description: 'Added creation timestamp',
          newValue: migrated.createdAt,
        });
      }

      if (!legacyData.modifiedAt) {
        changes.push({
          type: 'added',
          property: 'modifiedAt',
          description: 'Added modification timestamp',
          newValue: migrated.modifiedAt,
        });
      }
    }

    // For v2 to v3, mainly structural validation and timestamp updates
    if (sourceVersion === 'v2') {
      const legacyData = legacy as z.infer<typeof LegacyPresetV2Schema>;

      // Ensure ID exists
      if (!legacyData.id) {
        changes.push({
          type: 'added',
          property: 'id',
          description: 'Generated missing preset ID',
          newValue: migrated.id,
        });
      }

      // Ensure timestamps exist
      if (!legacyData.createdAt) {
        changes.push({
          type: 'added',
          property: 'createdAt',
          description: 'Added creation timestamp',
          newValue: migrated.createdAt,
        });
      }

      if (!legacyData.modifiedAt) {
        changes.push({
          type: 'modified',
          property: 'modifiedAt',
          description: 'Updated modification timestamp',
          oldValue: legacyData.modifiedAt,
          newValue: migrated.modifiedAt,
        });
      }
    }

    return changes;
  }

  /**
   * Perform migration of a single preset
   */
  static async migrate(
    inputFile: string,
    outputFile?: string,
    options: {
      createBackup?: boolean;
      dryRun?: boolean;
      force?: boolean;
      targetVersion?: string;
    } = {}
  ): Promise<PresetMigrationResult> {
    const startTime = Date.now();
    const {
      createBackup = true,
      dryRun = false,
      force = false,
      targetVersion = this.TARGET_VERSION,
    } = options;

    const result: PresetMigrationResult = {
      success: false,
      sourceVersion: 'unknown',
      targetVersion,
      inputFile,
      outputFile: outputFile || `${inputFile}.migrated`,
      presetId: '',
      presetName: '',
      changes: [],
      errors: [],
      warnings: [],
      duration: 0,
    };

    try {
      // Load legacy preset
      const legacyData = await loadData(inputFile);

      // Detect version
      result.sourceVersion = this.detectVersion(legacyData);

      if (result.sourceVersion === 'unknown') {
        result.errors.push('Unable to detect preset version');
        return result;
      }

      // Check if already current version
      if (result.sourceVersion === 'v3' && !force) {
        const validation = this.validatePreset(legacyData);
        if (validation.valid) {
          result.warnings.push('Preset is already in current format');
          result.success = true;
          result.presetId = (legacyData as BalancerPreset).id;
          result.presetName = (legacyData as BalancerPreset).name;
          return result;
        }
      }

      // Apply migrations step by step
      let currentData: unknown = legacyData;
      const migrationPath = [];

      if (result.sourceVersion === 'v1') {
        currentData = this.migrateV1ToV2(currentData as z.infer<typeof LegacyPresetV1Schema>);
        migrationPath.push('v1→v2');
      }

      if (['v1', 'v2'].includes(result.sourceVersion)) {
        currentData = this.migrateV2ToV3(currentData as z.infer<typeof LegacyPresetV2Schema>);
        migrationPath.push('v2→v3');
      }

      const migratedPreset = currentData as BalancerPreset;

      // Validate final result
      const validation = this.validatePreset(migratedPreset);
      if (!validation.valid) {
        result.errors.push(...validation.errors);
        return result;
      }

      result.presetId = migratedPreset.id;
      result.presetName = migratedPreset.name;

      // Generate changes report
      result.changes = this.generateChanges(legacyData, migratedPreset, result.sourceVersion);

      // Create backup if requested
      if (createBackup && !dryRun) {
        const backupFile = `${this.BACKUP_DIR}/preset_${result.presetId}_backup_${Date.now()}.json`;
        await saveData(backupFile, legacyData);
        result.backupFile = backupFile;
      }

      // Save migrated preset
      if (!dryRun) {
        await saveData(result.outputFile, migratedPreset);
      }

      result.success = true;
      result.warnings.push(`Successfully migrated preset: ${migrationPath.join(', ')}`);

    } catch (error) {
      result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      result.duration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Rollback a preset migration using backup
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
   * Batch migrate multiple preset files
   */
  static async batchMigrate(
    inputFiles: string[],
    options: {
      outputDir?: string;
      createBackup?: boolean;
      dryRun?: boolean;
      parallel?: boolean;
    } = {}
  ): Promise<PresetMigrationResult[]> {
    const {
      outputDir,
      createBackup = true,
      dryRun = false,
      parallel = false,
    } = options;

    const migrateFile = async (inputFile: string): Promise<PresetMigrationResult> => {
      const outputFile = outputDir
        ? `${outputDir}/${inputFile.split('/').pop()?.replace('.json', '.migrated.json')}`
        : `${inputFile}.migrated`;

      return this.migrate(inputFile, outputFile, { createBackup, dryRun });
    };

    if (parallel) {
      return Promise.all(inputFiles.map(migrateFile));
    } else {
      const results: PresetMigrationResult[] = [];
      for (const file of inputFiles) {
        results.push(await migrateFile(file));
      }
      return results;
    }
  }

  /**
   * Generate migration report
   */
  static generateReport(results: PresetMigrationResult[]): string {
    const lines: string[] = [];

    lines.push('# Preset Migration Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Summary
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = total - successful;

    lines.push('## Summary');
    lines.push(`- Total presets: ${total}`);
    lines.push(`- Successful: ${successful}`);
    lines.push(`- Failed: ${failed}`);
    lines.push(`- Success rate: ${((successful / total) * 100).toFixed(1)}%`);
    lines.push('');

    // Individual results
    lines.push('## Individual Results');
    results.forEach((result, index) => {
      lines.push(`### ${index + 1}. ${result.presetName} (${result.inputFile})`);
      lines.push(`- Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
      lines.push(`- Version: ${result.sourceVersion} → ${result.targetVersion}`);
      lines.push(`- Duration: ${result.duration}ms`);
      lines.push(`- Changes: ${result.changes.length}`);

      if (result.backupFile) {
        lines.push(`- Backup: ${result.backupFile}`);
      }

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

  /**
   * Get list of legacy preset files in the legacy directory
   */
  static async getLegacyPresetFiles(): Promise<string[]> {
    try {
      const files = await loadData('data/presets/balancer/legacy/index.json') as string[];
      return files.map(file => `data/presets/balancer/legacy/${file}`);
    } catch {
      // If index doesn't exist, try to find files manually
      // This is a simplified implementation - in practice you'd scan the directory
      return [];
    }
  }
}
